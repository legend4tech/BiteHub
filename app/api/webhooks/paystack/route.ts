import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { sendOrderReceiptEmail } from "@/lib/mail"
import { sendVendorNewOrderEmail } from "@/lib/mail"
import { sendVendorOrderNotification } from "@/lib/whatsapp"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""

export async function POST(req: Request) {
  try {
    const text = await req.text()
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(text)
      .digest("hex")

    const signature = req.headers.get("x-paystack-signature")

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(text)

    if (event.event === "charge.success") {
      await dbConnect()
      const reference = event.data.reference

      // Atomically update state only if it hasn't been set to paid yet
      // This guarantees that exactly one webhook or client verification call processes the success state and dispatches notifications
      const order = await Order.findOneAndUpdate(
        { paystackReference: reference, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "paid",
            status: "confirmed",
          },
        },
        { new: true }
      )

      if (order) {
        const wasPending = true // Since we flipped it from non-paid to paid, it was pending

        // ── Overwrite estimates with Paystack's actual ground-truth figures ──────────
        // event.data.fees        = exact Paystack processing fee, in kobo
        // event.data.subaccount.amount = exact amount deposited to vendor, in kobo
        if (typeof event.data.fees === "number") {
          order.serviceFee = event.data.fees / 100
        }
        if (
          event.data.subaccount &&
          typeof event.data.subaccount.amount === "number"
        ) {
          order.vendorRevenue = event.data.subaccount.amount / 100
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
            console.error("Failed to send receipt from webhook:", e)
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
            console.error("Failed to send WhatsApp from webhook:", e)
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
            console.error("Failed to send vendor order email from webhook:", e)
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[webhooks/paystack POST]", error)
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 })
  }
}
