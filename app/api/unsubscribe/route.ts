import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import { unsubscribeSchema } from "@/lib/schemas"
import Subscriber from "@/models/Subscriber"
import CustomerModel from "@/models/Customer"
import VendorModel from "@/models/Vendor"
import { generateUnsubscribeToken } from "@/lib/utils"
import { isRateLimitingEnabled, strictIpRateLimiter } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    if (isRateLimitingEnabled) {
      try {
        const { success } = await strictIpRateLimiter.limit(ip)
        if (!success) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
          )
        }
      } catch (e) {
        console.error("Rate limit check failed, allowing request:", e)
      }
    }

    // 2. Parse & Validate input
    const body = await req.json()
    const parsed = unsubscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { email, token } = parsed.data

    // 3. Constant-time token verification
    const expectedToken = generateUnsubscribeToken(email)
    const tokenBuf = Buffer.from(token)
    const expectedBuf = Buffer.from(expectedToken)

    const isValid =
      tokenBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(tokenBuf, expectedBuf)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe link" },
        { status: 400 }
      )
    }

    // 4. Update marketing preferences in DB
    await dbConnect()
    const normalizedEmail = email.toLowerCase().trim()

    await Promise.all([
      Subscriber.updateOne({ email: normalizedEmail }, { isActive: false }),
      CustomerModel.updateMany(
        { email: normalizedEmail },
        { receivesMarketing: false }
      ),
      VendorModel.updateMany(
        { email: normalizedEmail },
        { receivesMarketing: false }
      ),
    ])

    return NextResponse.json({
      success: true,
      message: "Unsubscribed successfully",
    })
  } catch (error) {
    console.error("[POST /api/unsubscribe]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
