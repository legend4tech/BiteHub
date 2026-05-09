import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Vendor from "@/models/Vendor";
import Order from "@/models/Order";
import { serializeOrder } from "@/lib/serializers";
import { sendVendorOrderNotification } from "@/lib/whatsapp";


export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ orderId }).lean();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeOrder(order));
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// ── POST /api/orders 

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      vendorId,
      vendorName,
      vendorWhatsappNumber,
      vendorPhone, // Fallback for cached frontends
      items,
      customerName,
      customerPhone,
      notes,
      total,
    } = body;

    const finalWhatsapp = vendorWhatsappNumber !== undefined ? vendorWhatsappNumber : vendorPhone;

    // Basic validation
    // Note: vendorWhatsappNumber might be "" if the vendor hasn't set one, so we check for undefined instead of truthiness.
    if (!vendorId || !vendorName || finalWhatsapp === undefined || !items?.length || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify vendor exists and is active before accepting the order
    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor || !vendor.isActive) {
      return NextResponse.json(
        { error: "Vendor not found or inactive" },
        { status: 404 }
      );
    }

    // Generate a human-readable order ID
    // Format: ORD-ULI-XXXX where XXXX is a random 4-digit number
   const orderId = `CB-${Date.now().toString().slice(-4)}-${Math.random()
  .toString(36)
  .substring(2, 5)
  .toUpperCase()}`
  
    const order = await Order.create({
      orderId,
      vendorId,
      vendorName,
      vendorWhatsappNumber: finalWhatsapp,
      items,
      customerName,
      customerPhone,
      notes: notes || "",
      totalAmount: total,
      status: "pending",
    });

    // Send WhatsApp Notification (fire and forget to not block response)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const trackingLink = `${baseUrl}/order/${order.orderId}`;
    sendVendorOrderNotification(finalWhatsapp, customerName, order.orderId, trackingLink);

    return NextResponse.json({ orderId: order.orderId }, { status: 201 });
  } catch (error) {
  console.error("FULL ERROR", JSON.stringify(error, Object.getOwnPropertyNames(error))); // ← add this
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}