import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import crypto from "crypto"
import Order from "@/models/Order"
import Customer from "@/models/Customer"
import dbConnect from "@/lib/db"
import { sendOrderReceiptEmail, sendVendorNewOrderEmail } from "@/lib/mail"
import { sendWalletTopupEmail } from "@/lib/walletMail"
import { sendVendorOrderNotification } from "@/lib/whatsapp"
import { verifyMonnifyTransaction } from "@/lib/monnify"
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants"
import Wallet from "@/models/Wallet"
import WalletTransaction from "@/models/WalletTransaction"
import { eventBus } from "@/lib/events"
import { formatPriceExact } from "@/lib/format"

async function processSuccessfulTransaction(paymentReference: string) {
  const monnifyData = await verifyMonnifyTransaction(paymentReference)

  if (monnifyData.paymentStatus !== "PAID") {
    console.warn(
      `[Collection Webhook] Transaction ${paymentReference} status is not PAID: ${monnifyData.paymentStatus}`
    )
    return
  }

  await dbConnect()

  // 1. Handle Wallet Funding (Reserved Account Deposit)
  if (
    monnifyData.product?.type === "RESERVED_ACCOUNT" ||
    monnifyData.product?.reference?.startsWith("WALLET-")
  ) {
    const accountRef = monnifyData.product.reference
    const wallet = await Wallet.findOne({
      monnifyReservedAccountRef: accountRef,
    })

    if (wallet) {
      const existingTx = await WalletTransaction.findOne({
        reference: paymentReference,
      })
      if (!existingTx) {
        // Use settlementAmount if available, otherwise amountPaid
        const amount = Number(
          monnifyData.settlementAmount ||
            monnifyData.amountPaid ||
            monnifyData.amount
        )

        const updatedWallet = await Wallet.findOneAndUpdate(
          { _id: wallet._id },
          { $inc: { balance: amount } },
          { new: true }
        )

        try {
          await WalletTransaction.create({
            customerId: wallet.customerId,
            type: "fiat_deposit",
            amount: amount,
            balanceAfter: updatedWallet.balance, // Set exact correct value atomically
            direction: "credit",
            reference: paymentReference,
            description: "Bank Transfer Deposit",
          })
        } catch (e: unknown) {
          if ((e as { code?: number }).code === 11000) {
            console.warn(
              `[Collection Webhook] Duplicate transaction for ${paymentReference} - gracefully ignored (Idempotency catch).`
            )
            // Rollback wallet increment if transaction already exists (another process beat us)
            await Wallet.findOneAndUpdate(
              { _id: wallet._id },
              { $inc: { balance: -amount } }
            )
            return NextResponse.json({ status: "Duplicate event" })
          }
          throw e
        }

        revalidatePath("/customer/wallet")

        // Broadcast the real-time event so the browser auto-refreshes!
        eventBus.emit("wallet_funded", wallet.customerId.toString())

        // Send Email
        const customer = await Customer.findById(wallet.customerId).lean()
        if (customer && customer.email) {
          sendWalletTopupEmail(
            customer.email,
            customer.name,
            formatPriceExact(amount),
            formatPriceExact(wallet.balance),
            paymentReference
          ).catch(console.error)
        }

        // Log removed for production
      } else {
        // Log removed for production
      }
    } else {
      console.error(
        `[Collection Webhook] Wallet not found for account ref: ${accountRef}`
      )
    }
    return
  }

  // 2. Handle Order Payments
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

  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    // Log removed for production
    return
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { orderId: order.orderId, paymentStatus: { $ne: PAYMENT_STATUS.PAID } },
    {
      $set: {
        paymentStatus: PAYMENT_STATUS.PAID,
        status: ORDER_STATUS.CONFIRMED,
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
  // Log removed for production

  // Create guest customer profile if they don't have one, since payment is now complete
  if (updatedOrder.customerEmail) {
    const existingCustomer = await Customer.findOne({
      email: updatedOrder.customerEmail.toLowerCase(),
    }).lean()

    if (!existingCustomer) {
      const randomReferral = crypto.randomBytes(4).toString("hex")
      await Customer.create({
        name: updatedOrder.customerName,
        email: updatedOrder.customerEmail.toLowerCase(),
        phone: updatedOrder.customerPhone,
        referralCode: `REF-${randomReferral.toUpperCase()}`,
        isActive: true,
      }).catch((err) =>
        console.error(
          "[Collection Webhook] Failed to create guest customer:",
          err
        )
      )
    }
  }

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

    // Webhook Timestamp / Age Validation (Replay Protection)
    const eventTimestampStr = eventData?.createdOn || eventData?.transactionDate
    if (eventTimestampStr) {
      // Use the Nigerian timezone offset or parse directly depending on the format.
      // Assuming Monnify sends ISO strings or parseable date strings.
      const eventTimestamp = new Date(eventTimestampStr).getTime()
      if (!isNaN(eventTimestamp)) {
        const ageMs = Date.now() - eventTimestamp
        // Reject events older than 10 minutes
        if (ageMs > 10 * 60 * 1000) {
          console.warn(
            "[Collection Webhook] Stale event rejected:",
            eventData?.paymentReference
          )
          return NextResponse.json({ status: "stale_event_ignored" })
        }
      }
    }

    // Log removed for production

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
  } catch (error: unknown) {
    console.error("[Collection Webhook] Unhandled error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Monnify Webhook Endpoint Active",
    message: "This endpoint is listening for POST requests from Monnify.",
  })
}
