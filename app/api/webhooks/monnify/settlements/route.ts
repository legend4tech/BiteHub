import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
async function processSettlement(
  amount: number,
  accountNumber: string,
  reference: string
) {
  await dbConnect()

  const vendor = await Vendor.findOneAndUpdate(
    {
      monnifyAccountNumber: accountNumber,
      processedSettlementRefs: { $ne: reference },
    },
    {
      $inc: { monnifyTotalDisbursedInKobo: amount },
      $addToSet: { processedSettlementRefs: reference },
    },
    { new: true }
  )

  if (!vendor) {
    // Check if the vendor exists but already processed this reference
    const existing = await Vendor.findOne({
      monnifyAccountNumber: accountNumber,
    })
    if (!existing) {
      console.warn(
        `[Settlement Webhook] No vendor found for account: ${accountNumber}. This may be the platform's main settlement account.`
      )
    } else {
      console.log(
        `[Settlement Webhook] Settlement ${reference} already processed for vendor ${existing.id}`
      )
    }
    return
  }
}
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("monnify-signature")
    if (!signature) {
      console.error("[Settlement Webhook] Missing monnify-signature header")
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }
    const secretKey = process.env.MONNIFY_SECRET_KEY || ""
    const computedHash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex")
    if (computedHash !== signature) {
      console.error("[Settlement Webhook] Invalid signature — rejected")
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }
    const event = JSON.parse(rawBody)
    const { eventType, eventData } = event
    // Log removed for production
    if (
      eventType === "SETTLEMENT" ||
      eventType === "SETTLEMENT_COMPLETION" ||
      eventType === "SUCCESSFUL_SETTLEMENT"
    ) {
      // Per Monnify docs: amount is a string e.g. "1199.00"
      const amount = Number(
        eventData?.amount ||
          eventData?.netAmount ||
          eventData?.totalAmountSettled ||
          0
      )
      // Per Monnify docs: destinationAccountNumber is the top-level field
      const accountNumber =
        eventData?.destinationAccountNumber ||
        eventData?.destinationAccountDetails?.accountNumber ||
        eventData?.accountNumber

      const reference =
        eventData?.reference ||
        eventData?.transactionReference ||
        eventData?.settlementReference ||
        "unknown"

      if (reference === "unknown") {
        console.error(
          "[Settlement Webhook] Could not extract reference for idempotency",
          { eventData }
        )
        // Return 200 so Monnify doesn't keep retrying for a data issue
        return NextResponse.json({ status: "ignored" })
      }

      if (!accountNumber || !amount) {
        console.error(
          "[Settlement Webhook] Could not extract accountNumber or amount",
          { accountNumber, amount, eventData }
        )
        // Return 200 so Monnify doesn't keep retrying for a data issue
        return NextResponse.json({ status: "ignored" })
      }

      const { nairaToKobo } = await import("@/lib/money")
      const amountInKobo = nairaToKobo(amount)

      // ✅ Awaited — ensures DB update completes before Vercel terminates
      await processSettlement(amountInKobo, accountNumber, reference)
    } else {
      console.warn(
        `[Settlement Webhook] Unexpected eventType: ${eventType} — ignoring`
      )
    }
    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[Settlement Webhook] Unhandled error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
