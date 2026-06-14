import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { verifyMonnifyTransaction } from "@/lib/monnify"
import { sendOrderReceiptEmail, sendVendorNewOrderEmail } from "@/lib/mail"
import { sendVendorOrderNotification } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"

/**
 * POST /api/vendor/orders/[orderId]/verify
 *
 * Allows a vendor to manually trigger a payment verification check for a
 * pending order. Use this when the customer paid but the order is still
 * pending (e.g., webhook missed due to network failure).
 *
 * Security: vendor can only verify their own orders.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (
      !session ||
      session.user?.role !== "vendor" ||
      !session.user?.vendorId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: orderId } = await params
    await dbConnect()

    const { Types } = await import("mongoose")
    const vendorObjectId = new Types.ObjectId(session.user.vendorId)

    // Find the order and confirm it belongs to this vendor
    const order = await Order.findOne({ orderId, vendorId: vendorObjectId })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or does not belong to your account." },
        { status: 404 }
      )
    }

    // Already paid — nothing to do
    if (order.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        message: "This order is already marked as paid.",
      })
    }

    if (!order.monnifyReference) {
      return NextResponse.json(
        { error: "No Monnify payment reference on this order." },
        { status: 400 }
      )
    }

    // Query Monnify for the current payment status
    let monnifyData: { paymentStatus: string }
    try {
      monnifyData = await verifyMonnifyTransaction(order.monnifyReference)
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Could not reach Monnify to verify this payment. Please try again in a moment.",
        },
        { status: 502 }
      )
    }

    if (monnifyData.paymentStatus !== "PAID") {
      return NextResponse.json({
        success: false,
        message: `Payment not confirmed by Monnify yet. Current status: ${monnifyData.paymentStatus || "PENDING"}. Ask the customer to complete payment.`,
      })
    }

    // Payment confirmed — update the order (idempotent upsert)
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId, paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "paid", status: "confirmed" } },
      { new: true }
    )

    if (!updatedOrder) {
      // Was already updated by a concurrent request / webhook — that's fine
      return NextResponse.json({
        success: true,
        message: "Order has been confirmed.",
      })
    }

    // Fire notifications (non-blocking)
    if (updatedOrder.customerEmail) {
      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/order/${orderId}`
      sendOrderReceiptEmail(
        updatedOrder.customerEmail,
        updatedOrder.customerName,
        updatedOrder.orderId,
        updatedOrder.vendorName,
        updatedOrder.totalAmount,
        updatedOrder.deliveryFee || 0,
        updatedOrder.serviceFee || 0,
        updatedOrder.items,
        trackingUrl
      ).catch(console.error)
    }

    if (updatedOrder.vendorWhatsappNumber) {
      sendVendorOrderNotification(
        updatedOrder.vendorWhatsappNumber,
        updatedOrder.customerName,
        updatedOrder.orderId,
        updatedOrder.vendorRevenue
      ).catch(console.error)
    }

    sendVendorNewOrderEmail(
      String(updatedOrder.vendorId),
      updatedOrder.vendorName,
      updatedOrder.orderId,
      updatedOrder.customerName,
      updatedOrder.customerPhone,
      updatedOrder.location,
      updatedOrder.items,
      updatedOrder.deliveryFee || 0,
      updatedOrder.serviceFee || 0,
      updatedOrder.totalAmount,
      updatedOrder.vendorRevenue,
      updatedOrder.platformCommission || 0,
      updatedOrder.notes || undefined
    ).catch(console.error)

    return NextResponse.json({
      success: true,
      message:
        "Payment verified! Order has been confirmed. Notifications sent to customer.",
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    console.error("[vendor/orders/verify POST]", errMsg)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
