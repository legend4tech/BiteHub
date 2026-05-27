import { NextResponse } from "next/server"
import axios from "axios"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { sendOrderReceiptEmail } from "@/lib/mail"
import { sendVendorNewOrderEmail } from "@/lib/mail"
import { sendVendorOrderNotification } from "@/lib/whatsapp"

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

    if (!order.paystackReference) {
      return NextResponse.json(
        { error: "No Paystack reference on this order" },
        { status: 400 }
      )
    }

    // Verify with Paystack using axios
    const paystackRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${order.paystackReference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const paystackData = paystackRes.data

    if (paystackData.status && paystackData.data.status === "success") {
      // Atomically acquire lock and update state
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "paid",
            status: "confirmed",
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

      // ── Overwrite estimates with Paystack's actual ground-truth figures ──────────
      // paystackData.data.fees           = exact Paystack processing fee, in kobo
      // paystackData.data.subaccount.amount = exact amount deposited to vendor, in kobo
      if (typeof paystackData.data.fees === "number") {
        updatedOrder.serviceFee = paystackData.data.fees / 100
      }
      if (
        paystackData.data.subaccount &&
        typeof paystackData.data.subaccount.amount === "number"
      ) {
        updatedOrder.vendorRevenue = paystackData.data.subaccount.amount / 100
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
    })
  } catch (error) {
    console.error("[orders/[orderId]/verify POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
