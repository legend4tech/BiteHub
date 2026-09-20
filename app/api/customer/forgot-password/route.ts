import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import CustomerModel from "@/models/Customer"
import crypto from "crypto"
import { sendCustomerPasswordResetEmail } from "@/lib/mail"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"
import { forgotPasswordSchema } from "@/lib/schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid email" },
        { status: 400 }
      )
    }

    const { email } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(
        `forgot_password_${normalizedEmail}`
      )
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    await dbConnect()

    const user = await CustomerModel.findOne({ email: normalizedEmail })

    // Always return success even if user not found to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists, a reset link has been sent.",
      })
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex")

    const expiryMinutes = parseInt(
      process.env.PASSWORD_RESET_EXPIRY_MINUTES || "15",
      10
    )

    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = new Date(Date.now() + expiryMinutes * 60 * 1000)
    await user.save()

    // Send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetLink = `${appUrl}/customer/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`
    const customerName = user.name || "Customer"

    const emailResult = await sendCustomerPasswordResetEmail(
      normalizedEmail,
      customerName,
      resetLink,
      expiryMinutes
    )

    if (!emailResult.success) {
      console.error("Failed to send customer reset email:", emailResult.error)
      // We still return 200 so the user doesn't know if the email exists or not (security),
      // but you will now see this error in your terminal!
    }

    return NextResponse.json({
      message: "If an account exists, a reset link has been sent.",
    })
  } catch (error) {
    console.error("[forgot-password POST]", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
