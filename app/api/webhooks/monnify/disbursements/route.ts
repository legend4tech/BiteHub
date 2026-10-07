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

  // Monnify sends destinationAccountNumber = the vendor's bank account they registered
  const vendor = await Vendor.findOne({ monnifyAccountNumber: accountNumber })

  if (!vendor) {
    console.warn(
      `[Disbursement Webhook] No vendor found for account: ${accountNumber}`
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

  // Atomically update ONLY IF the reference is not already in the array (Concurrency safety)
  await Vendor.findOneAndUpdate(
    {
      _id: vendor._id,
      processedDisbursementRefs: { $ne: reference },
    },
    updateDoc
  )
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
