import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"

async function processDisbursement(
  amount: number,
  accountNumber: string,
  reference: string,
  isSuccess: boolean
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

  if (!isSuccess) {
    console.warn(
      `[Disbursement Webhook] ❌ Disbursement FAILED for vendor "${vendor.slug}". Ref: ${reference}. Rolling back optimistic deduction.`
    )
    updateDoc.$inc = {
      walletTotalDisbursedInKobo: -amount,
      pendingWalletBalanceInKobo: amount,
    }
  }
  // Note: On isSuccess === true, walletTotalDisbursedInKobo was already optimistically
  // incremented by payoutService/retry-payout. We do NOT increment monnifyTotalDisbursedInKobo,
  // which is strictly for Monnify sub-account settlements, avoiding double-counting in vendor stats.

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

      if (!isSuccess) {
        // Reset isDisbursed on the vendor's orders that were marked for this payout amount
        const { default: Order } = await import("@/models/Order")

        // First attempt deterministic rollback via stamped payoutReference
        const exactMatchRes = await Order.updateMany(
          { payoutReference: reference },
          { $set: { isDisbursed: false, payoutReference: null } },
          { session }
        )

        // Fallback: If no orders had payoutReference stamped (e.g. legacy batches),
        // fallback to amount-capped running total
        if (exactMatchRes.matchedCount === 0) {
          const disbursedOrders = await Order.find({
            vendorId: vendor._id,
            paymentMethod: "wallet",
            paymentStatus: "paid",
            isDisbursed: true,
          })
            .sort({ createdAt: -1 })
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

    const secretKey = process.env.MONNIFY_SECRET_KEY
    if (!secretKey) {
      console.error(
        "[Disbursement Webhook] Missing MONNIFY_SECRET_KEY environment variable"
      )
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      )
    }

    const computedHash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex")

    const sigBuf = Buffer.from(signature, "hex")
    const compBuf = Buffer.from(computedHash, "hex")

    if (
      sigBuf.length !== compBuf.length ||
      !crypto.timingSafeEqual(sigBuf, compBuf)
    ) {
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
      const isSuccess =
        eventType === "SUCCESSFUL_DISBURSEMENT" ||
        ["SUCCESS", "SUCCESSFUL", "PAID"].includes(
          String(eventData?.status || "").toUpperCase()
        )

      if (!accountNumber || !amount || !reference) {
        console.error(
          "[Disbursement Webhook] Could not extract accountNumber, amount, or reference",
          { accountNumber, amount, reference, eventData }
        )
        // Return 200 so Monnify doesn't keep retrying for a data issue
        return NextResponse.json({ status: "ignored" })
      }

      const { nairaToKobo } = await import("@/lib/money")
      const amountInKobo = nairaToKobo(amount)

      // ✅ Awaited — ensures DB update completes before Vercel terminates
      await processDisbursement(
        amountInKobo,
        accountNumber,
        reference,
        isSuccess
      )
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
