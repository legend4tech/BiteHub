import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"
import { CURRENT_TERMS_VERSION } from "@/lib/constants"
import { strictRateLimiter } from "@/lib/rate-limit"
// ── POST /api/customer/accept-terms ─────────────────────────────────────────
export async function POST() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { success } = await strictRateLimiter.limit(
      `accept-terms-${session.user.id}`
    )
    if (!success) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      )
    }
    await dbConnect()
    const customer = await Customer.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          acceptedTermsVersion: CURRENT_TERMS_VERSION,
          acceptedTermsAt: new Date(),
        },
      },
      { new: true }
    )
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/customer/accept-terms]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
