import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
async function processSettlement(amount: number, accountNumber: string) {
  await dbConnect()
  const vendor = await Vendor.findOne({ monnifyAccountNumber: accountNumber })
  if (!vendor) {
    console.warn(
      `[Settlement Webhook] No vendor found for account: ${accountNumber}. This may be the platform's main settlement account.`
    )
    return
  }
  const currentDisbursed = vendor.monnifyTotalDisbursedInKobo || 0
  vendor.monnifyTotalDisbursedInKobo = currentDisbursed + amount
  await vendor.save()
  // Log removed for production
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

      if (!accountNumber || !amount) {
        console.error(
          "[Settlement Webhook] Could not extract accountNumber or amount",
          { accountNumber, amount, eventData }
        )
        // Return 200 so Monnify doesn't keep retrying for a data issue
        return NextResponse.json({ status: "ignored" })
      }
      // ✅ Awaited — ensures DB update completes before Vercel terminates
      await processSettlement(amount, accountNumber)
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
