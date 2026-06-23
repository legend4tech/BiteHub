import { NextResponse } from "next/server"
import { verifyMonnifyTransaction } from "@/lib/monnify"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { sendOrderReceiptEmail } from "@/lib/mail"
import { sendVendorNewOrderEmail } from "@/lib/mail"
import { sendVendorOrderNotification } from "@/lib/whatsapp"
import { ORDER_STATUS } from "@/lib/constants"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    await dbConnect()
    const order = await Order.findOne({ orderId })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ success: true, alreadyPaid: true })
    }

    if (!order.monnifyReference) {
      return NextResponse.json(
        { error: "No Monnify reference on this order" },
        { status: 400 }
      )
    }

    // Verify with Monnify
    const monnifyData = await verifyMonnifyTransaction(order.monnifyReference)

    if (monnifyData.paymentStatus === "PAID") {
      // Atomically acquire lock and update state
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "paid",
            status: ORDER_STATUS.CONFIRMED,
          },
        },
        { new: true }
      )

      if (!updatedOrder) {
        return NextResponse.json({
          success: true,
          message: "Payment verified successfully",
        })
      }

      const wasPending = true // Since we atomically transitioned the state, wasPending is true

      // ── Overwrite estimates with Monnify's actual ground-truth figures ──────────
      if (typeof monnifyData.fee === "number") {
        updatedOrder.serviceFee = monnifyData.fee
      }

      if (
        monnifyData.incomeSplitConfig &&
        monnifyData.incomeSplitConfig.length > 0
      ) {
        // If there's a split setup, find the vendor's subaccount amount (if possible) or just use the first split.
        // Usually, splitAmount is present in the config sent.
        const vendorSplit = monnifyData.incomeSplitConfig[0]
        if (typeof vendorSplit.splitAmount === "number") {
          updatedOrder.vendorRevenue = vendorSplit.splitAmount
        }
      }

      await updatedOrder.save()

      // Send email if order wasn't previously paid and has an email
      if (wasPending && updatedOrder.customerEmail) {
        const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/order/${updatedOrder.orderId}`

        sendOrderReceiptEmail(
          updatedOrder.customerEmail,
          updatedOrder.customerName,
          updatedOrder.orderId,
          updatedOrder.vendorName,
          updatedOrder.totalAmount,
          updatedOrder.deliveryFee || 0,
          updatedOrder.serviceFee || 0,
          updatedOrder.items.map(
            (item: { name: string; quantity: number; price: number }) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })
          ),
          trackingUrl
        ).catch((e) =>
          console.error("Failed to send receipt from verify endpoint:", e)
        )
      }

      // Send WhatsApp notification if it wasn't previously paid
      if (wasPending && updatedOrder.vendorWhatsappNumber) {
        sendVendorOrderNotification(
          updatedOrder.vendorWhatsappNumber,
          updatedOrder.customerName,
          updatedOrder.orderId,
          updatedOrder.vendorRevenue
        ).catch((e) =>
          console.error("Failed to send WhatsApp from verify endpoint:", e)
        )
      }

      // Send vendor email notification
      if (wasPending) {
        sendVendorNewOrderEmail(
          String(updatedOrder.vendorId),
          updatedOrder.vendorName,
          updatedOrder.orderId,
          updatedOrder.customerName,
          updatedOrder.customerPhone,
          updatedOrder.location,
          updatedOrder.items.map(
            (item: { name: string; quantity: number; price: number }) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })
          ),
          updatedOrder.deliveryFee || 0,
          updatedOrder.serviceFee || 0,
          updatedOrder.totalAmount,
          updatedOrder.vendorRevenue,
          updatedOrder.platformCommission || 0,
          updatedOrder.notes || undefined
        ).catch((e) =>
          console.error("Failed to send vendor order email from verify:", e)
        )
      }

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
      })
    }

    return NextResponse.json({
      success: false,
      message: "Payment not successful yet",
      paymentStatus: monnifyData.paymentStatus, // Pass actual status back to client
    })
  } catch (error) {
    console.error("[orders/[orderId]/verify POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
