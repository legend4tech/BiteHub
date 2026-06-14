import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import Vendor from "@/models/Vendor"
import { sendOrderReceiptEmail, sendVendorNewOrderEmail } from "@/lib/mail"
import { sendVendorOrderNotification } from "@/lib/whatsapp"
import { verifyMonnifyTransaction } from "@/lib/monnify"

async function processSuccessfulTransaction(paymentReference: string) {
  try {
    const monnifyData = await verifyMonnifyTransaction(paymentReference)

    if (monnifyData.paymentStatus === "PAID") {
      await dbConnect()

      let order = await Order.findOne({ monnifyReference: paymentReference })

      if (!order) {
        // Fallback: If it's a retry, we might have updated the DB to a new reference,
        // but they paid the old one. Extract the orderId from the reference.
        // References are formatted as: BH-PAY-{orderId} or BH-PAY-{orderId}-{timestamp}
        const parts = paymentReference.split("-")
        if (parts.length >= 3 && parts[0] === "BH" && parts[1] === "PAY") {
          const orderId = parts[2]
          order = await Order.findOne({ orderId })
        }
      }

      if (!order) {
        console.error(
          "Monnify Webhook: Order not found for reference",
          paymentReference
        )
        return
      }

      if (order.paymentStatus === "paid") {
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

      if (updatedOrder) {
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

        // Send notifications
        if (updatedOrder.customerEmail) {
          const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/order/${updatedOrder.orderId}`
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
    }
  } catch (error) {
    console.error(
      "[processSuccessfulTransaction] Error processing background webhook:",
      error
    )
  }
}

async function processDisbursement(amount: number, accountNumber?: string) {
  if (!accountNumber || !amount) return

  try {
    await dbConnect()

    // Find the vendor by the bank account number they registered with Monnify
    const vendor = await Vendor.findOne({ monnifyAccountNumber: accountNumber })

    if (vendor) {
      const currentDisbursed = vendor.monnifyTotalDisbursed || 0
      vendor.monnifyTotalDisbursed = currentDisbursed + amount
      await vendor.save()
      console.log(
        `[Monnify Webhook] Incremented disbursed amount for vendor ${vendor.slug} by ${amount}`
      )
    } else {
      console.warn(
        `[Monnify Webhook] No vendor found for account number: ${accountNumber}`
      )
    }
  } catch (error) {
    console.error("[processDisbursement] Error:", error)
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("monnify-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const secretKey = process.env.MONNIFY_SECRET_KEY || ""
    const computedHash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex")

    if (computedHash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    const event = JSON.parse(rawBody)

    // Acknowledge Monnify immediately with a 200 OK
    // Then process the transaction asynchronously to prevent Monnify from timing out

    if (event.eventType === "SUCCESSFUL_TRANSACTION") {
      const paymentReference = event.eventData.paymentReference
      // Process in background without awaiting
      processSuccessfulTransaction(paymentReference)
    }

    // ── Settlement: funds cleared from Monnify to bank accounts ─────────
    if (
      event.eventType === "SETTLEMENT_COMPLETION" ||
      event.eventType === "SETTLEMENT"
    ) {
      console.log("[Monnify Webhook] Settlement completed:", {
        amount: event.eventData?.amount || event.eventData?.totalAmountSettled,
        account: event.eventData?.destinationAccountDetails?.accountNumber,
      })
      const amount =
        event.eventData?.amount || event.eventData?.totalAmountSettled
      const account = event.eventData?.destinationAccountDetails?.accountNumber
      if (amount && account) {
        processDisbursement(Number(amount), account)
      }
    }

    // ── Disbursement: initiated payout to sub-account ────────────────────
    if (event.eventType === "SUCCESSFUL_DISBURSEMENT") {
      console.log("[Monnify Webhook] Disbursement successful:", {
        reference: event.eventData?.reference,
        amount: event.eventData?.amount,
        destination: event.eventData?.destinationAccountName,
        account: event.eventData?.destinationAccountNumber,
      })
      const amount = event.eventData?.amount
      const account = event.eventData?.destinationAccountNumber
      if (amount && account) {
        processDisbursement(Number(amount), account)
      }
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Monnify Webhook Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
