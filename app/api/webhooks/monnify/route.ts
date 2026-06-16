import { NextResponse } from "next/server"
import crypto from "crypto"
import Order from "@/models/Order"
import dbConnect from "@/lib/db"
import { sendOrderReceiptEmail, sendVendorNewOrderEmail } from "@/lib/mail"
import { sendVendorOrderNotification } from "@/lib/whatsapp"
import { verifyMonnifyTransaction } from "@/lib/monnify"

async function processSuccessfulTransaction(paymentReference: string) {
  const monnifyData = await verifyMonnifyTransaction(paymentReference)

  if (monnifyData.paymentStatus !== "PAID") {
    console.warn(
      `[Collection Webhook] Transaction ${paymentReference} status is not PAID: ${monnifyData.paymentStatus}`
    )
    return
  }

  await dbConnect()

  let order = await Order.findOne({ monnifyReference: paymentReference })

  if (!order) {
    // Fallback: references formatted as BH-PAY-{orderId} or BH-PAY-{orderId}-{timestamp}
    const parts = paymentReference.split("-")
    if (parts.length >= 3 && parts[0] === "BH" && parts[1] === "PAY") {
      const orderId = parts[2]
      order = await Order.findOne({ orderId })
    }
  }

  if (!order) {
    console.error(
      "[Collection Webhook] Order not found for reference:",
      paymentReference
    )
    return
  }

  if (order.paymentStatus === "paid") {
    console.log(
      `[Collection Webhook] Order ${order.orderId} already marked as paid — skipping`
    )
    return
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { orderId: order.orderId, paymentStatus: { $ne: "paid" } },
    {
      $set: {
        paymentStatus: "paid",
        status: "confirmed",
      },
    },
    { new: true }
  )

  if (!updatedOrder) return

  if (typeof monnifyData.fee === "number") {
    updatedOrder.serviceFee = monnifyData.fee
  }

  if (
    monnifyData.incomeSplitConfig &&
    monnifyData.incomeSplitConfig.length > 0
  ) {
    const vendorSplit = monnifyData.incomeSplitConfig[0]
    if (typeof vendorSplit.splitAmount === "number") {
      updatedOrder.vendorRevenue = vendorSplit.splitAmount
    }
  }

  await updatedOrder.save()
  console.log(
    `[Collection Webhook] ✅ Order ${updatedOrder.orderId} confirmed. Vendor revenue: ₦${updatedOrder.vendorRevenue}`
  )

  // Fire-and-forget notifications — these are non-critical
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/order/${updatedOrder.orderId}`

  if (updatedOrder.customerEmail) {
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
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("monnify-signature")

    if (!signature) {
      console.error("[Collection Webhook] Missing monnify-signature header")
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const secretKey = process.env.MONNIFY_SECRET_KEY || ""
    const computedHash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex")

    if (computedHash !== signature) {
      console.error("[Collection Webhook] Invalid signature — rejected")
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    const event = JSON.parse(rawBody)
    const { eventType, eventData } = event

    console.log(`[Collection Webhook] Received event: ${eventType}`)

    if (eventType === "SUCCESSFUL_TRANSACTION") {
      const paymentReference = eventData?.paymentReference
      if (!paymentReference) {
        console.error("[Collection Webhook] Missing paymentReference in event")
        return NextResponse.json({ status: "ignored" })
      }

      // ✅ Awaited — ensures DB update completes before Vercel terminates
      await processSuccessfulTransaction(paymentReference)
    } else {
      console.warn(
        `[Collection Webhook] Unexpected eventType: ${eventType} — ignoring. Route for disbursements: /api/webhooks/monnify/disbursements, settlements: /api/webhooks/monnify/settlements`
      )
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[Collection Webhook] Unhandled error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
