import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"

async function processDisbursement(
  amount: number,
  accountNumber: string,
  reference: string,
  status: string
) {
  await dbConnect()

  // 1. Prioritize vendor lookup by ID encoded in the reference: payout-${vendorId}-${timestamp}
  let vendor = null
  if (reference?.startsWith("payout-")) {
    const parts = reference.split("-")
    if (parts.length >= 2 && parts[1]) {
      const vendorId = parts[1]
      try {
        vendor = await Vendor.findById(vendorId)
      } catch {
        // Fallback to accountNumber if invalid ObjectId
      }
    }
  }

  // 2. Fallback to destination account number if reference lookup did not match
  if (!vendor) {
    vendor = await Vendor.findOne({ monnifyAccountNumber: accountNumber })
  }

  if (!vendor) {
    console.warn(
      `[Disbursement Webhook] No vendor found for ref "${reference}" or account: ${accountNumber}`
    )
    return
  }

  // Idempotency Check in memory first
  if (vendor.processedDisbursementRefs?.includes(reference)) {
    console.warn(
      `[Disbursement Webhook] Duplicate reference ${reference} ignored (Idempotency catch).`
    )
    return
  }

  const updateDoc: Record<string, unknown> = {
    $addToSet: { processedDisbursementRefs: reference },
  }

  if (status === "SUCCESS") {
    updateDoc.$inc = { monnifyTotalDisbursedInKobo: amount }
  } else {
    console.warn(
      `[Disbursement Webhook] ❌ Disbursement FAILED for vendor "${vendor.slug}". Ref: ${reference}. Rolling back optimistic deduction.`
    )
    updateDoc.$inc = {
      walletTotalDisbursedInKobo: -amount,
      pendingWalletBalanceInKobo: amount,
    }
  }

  const mongoose = (await import("mongoose")).default
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      // Atomically update ONLY IF the reference is not already in the array (Concurrency safety)
      const updatedVendor = await Vendor.findOneAndUpdate(
        {
          _id: vendor._id,
          processedDisbursementRefs: { $ne: reference },
        },
        updateDoc,
        { new: true, session }
      )

      if (!updatedVendor) {
        console.warn(
          `[Disbursement Webhook] Duplicate reference ${reference} ignored (Concurrency catch).`
        )
        return
      }

      if (status !== "SUCCESS") {
        // Reset isDisbursed on the vendor's orders that were marked for this payout amount
        const { default: Order } = await import("@/models/Order")
        const disbursedOrders = await Order.find({
          vendorId: vendor._id,
          paymentMethod: "wallet",
          paymentStatus: "paid",
          isDisbursed: true,
        })
          .sort({ updatedAt: -1 })
          .select("_id vendorRevenueInKobo")
          .session(session)
          .lean()

        let runningTotal = 0
        const orderIdsToReset = []
        for (const doOrder of disbursedOrders) {
          if (runningTotal + doOrder.vendorRevenueInKobo > amount) {
            break
          }
          runningTotal += doOrder.vendorRevenueInKobo
          orderIdsToReset.push(doOrder._id)
        }

        if (orderIdsToReset.length > 0) {
          await Order.updateMany(
            { _id: { $in: orderIdsToReset } },
            { $set: { isDisbursed: false } },
            { session }
          )
        }
      }
    })
  } finally {
    session.endSession()
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("monnify-signature")

    if (!signature) {
      console.error("[Disbursement Webhook] Missing monnify-signature header")
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const secretKey = process.env.MONNIFY_SECRET_KEY || ""
    const computedHash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex")

    if (computedHash !== signature) {
      console.error("[Disbursement Webhook] Invalid signature — rejected")
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    const event = JSON.parse(rawBody)
    const { eventType, eventData } = event

    // Log removed for production

    if (
      eventType === "SUCCESSFUL_DISBURSEMENT" ||
      eventType === "FAILED_DISBURSEMENT"
    ) {
      const amount = Number(eventData?.amount ?? 0)
      // Per Monnify docs: the field is "destinationAccountNumber"
      const accountNumber =
        eventData?.destinationAccountNumber ||
        eventData?.accountNumber ||
        eventData?.destinationAccountDetails?.accountNumber

      const reference = eventData?.reference || eventData?.transactionReference
      const status = eventData?.status ?? "FAILED"

      if (!accountNumber || !amount) {
        console.error(
          "[Disbursement Webhook] Could not extract accountNumber or amount",
          { accountNumber, amount, eventData }
        )
        // Return 200 so Monnify doesn't keep retrying for a data issue
        return NextResponse.json({ status: "ignored" })
      }

      const { nairaToKobo } = await import("@/lib/money")
      const amountInKobo = nairaToKobo(amount)

      // ✅ Awaited — ensures DB update completes before Vercel terminates
      await processDisbursement(amountInKobo, accountNumber, reference, status)
    } else {
      console.warn(
        `[Disbursement Webhook] Unexpected eventType: ${eventType} — ignoring`
      )
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[Disbursement Webhook] Unhandled error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
