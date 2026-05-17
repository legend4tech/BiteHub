import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Vendor from "@/models/Vendor";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import { serializeOrder } from "@/lib/serializers";
import { sendVendorOrderNotification } from "@/lib/whatsapp";
import { ORDER_STATUS } from "@/lib/constants";
import { z } from "zod";

const orderItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const createOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorWhatsappNumber: z.string().optional(),
  vendorPhone: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Customer phone is required"),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
  total: z.number().optional(), // We accept it but ignore it for calculation
});

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
    
    // Validate request body using Zod
    const parsedBody = createOrderSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const {
      vendorId,
      vendorName,
      vendorWhatsappNumber,
      vendorPhone, // Fallback for cached frontends
      items,
      customerName,
      customerPhone,
      location,
      notes,
    } = parsedBody.data;

    const finalWhatsapp = vendorWhatsappNumber !== undefined ? vendorWhatsappNumber : vendorPhone;

    if (finalWhatsapp === undefined) {
      return NextResponse.json(
        { error: "Vendor WhatsApp number is required" },
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

    // Server-side Price Calculation (Fixes Client-Side Pricing Trust Vulnerability)
    let calculatedTotal = 0;
    const itemIds = items.map(item => item.menuItemId);
    const dbMenuItems = await MenuItem.find({ _id: { $in: itemIds }, vendorId }).lean();
    
    const dbMenuItemsMap = new Map(dbMenuItems.map((item: any) => [item._id.toString(), item]));

    for (const item of items) {
      const dbItem: any = dbMenuItemsMap.get(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { error: `Menu item not found: ${item.name}` },
          { status: 404 }
        );
      }
      calculatedTotal += dbItem.price * item.quantity;
      
      // Update item price to the actual DB price just to be safe
      item.price = dbItem.price;
    }

    // Generate a collision-resistant order ID
    // Format: CB-<full base-36 timestamp>-<6 UUID hex chars>
    // e.g. CB-LKZM4X8C-A3F1B2
    const orderId = `CB-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;

    const order = await Order.create({
      orderId,
      vendorId,
      vendorName,
      vendorWhatsappNumber: finalWhatsapp,
      items,
      customerName,
      customerPhone,
      location,
      notes: notes || "",
      totalAmount: calculatedTotal,
      status: ORDER_STATUS.PENDING,
    });

    // Send WhatsApp Notification (fire and forget to not block response)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const trackingLink = `${baseUrl}/order/${order.orderId}`;
    sendVendorOrderNotification(finalWhatsapp, customerName, order.orderId, trackingLink);

    return NextResponse.json({ orderId: order.orderId }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders] Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}