import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import RewardVoucher from "@/models/RewardVoucher"
import { applyVoucherSchema } from "@/lib/schemas/customer"
import { strictRateLimiter } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Strict rate limit to prevent brute forcing voucher codes
    const { success } = await strictRateLimiter.limit(
      `apply-voucher-${session.user.id}`
    )
    if (!success) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 })
    }

    const body = await req.json()
    const parseResult = applyVoucherSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { code } = parseResult.data

    await dbConnect()

    const voucher = await RewardVoucher.findOne({
      code: code.toUpperCase(),
      customerId: session.user.id,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    })

    if (!voucher) {
      return NextResponse.json(
        { error: "Invalid, expired, or already used voucher." },
        { status: 404 }
      )
    }

    // We don't mark it as used here. It gets marked as used when the order is completed.
    // We just return it so the checkout UI can apply the discount.
    return NextResponse.json({ success: true, voucher })
  } catch (error) {
    console.error("[POST /api/customer/gamification/vouchers/apply]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
