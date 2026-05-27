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
      const wasPending = order.paymentStatus !== "paid"
      order.paymentStatus = "paid"
      if (order.status === "pending") {
        order.status = "confirmed"
      }

      // ── Overwrite estimates with Paystack's actual ground-truth figures ──────────
      // paystackData.data.fees           = exact Paystack processing fee, in kobo
      // paystackData.data.subaccount.amount = exact amount deposited to vendor, in kobo
      if (typeof paystackData.data.fees === "number") {
        order.serviceFee = paystackData.data.fees / 100
      }
      if (
        paystackData.data.subaccount &&
        typeof paystackData.data.subaccount.amount === "number"
      ) {
        order.vendorRevenue = paystackData.data.subaccount.amount / 100
      }

      await order.save()

      // Send email if order wasn't previously paid and has an email
      if (wasPending && order.customerEmail) {
        const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/order/${order.orderId}`

        sendOrderReceiptEmail(
          order.customerEmail,
          order.customerName,
          order.orderId,
          order.vendorName,
          order.totalAmount,
          order.deliveryFee || 0,
          order.serviceFee || 0,
          order.items.map(
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
      if (wasPending && order.vendorWhatsappNumber) {
        sendVendorOrderNotification(
          order.vendorWhatsappNumber,
          order.customerName,
          order.orderId,
          order.vendorRevenue
        ).catch((e) =>
          console.error("Failed to send WhatsApp from verify endpoint:", e)
        )
      }

      // Send vendor email notification
      if (wasPending) {
        sendVendorNewOrderEmail(
          String(order.vendorId),
          order.vendorName,
          order.orderId,
          order.customerName,
          order.customerPhone,
          order.location,
          order.items.map(
            (item: { name: string; quantity: number; price: number }) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })
          ),
          order.deliveryFee || 0,
          order.serviceFee || 0,
          order.totalAmount,
          order.vendorRevenue,
          order.notes || undefined
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
