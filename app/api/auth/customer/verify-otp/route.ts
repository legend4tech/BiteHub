import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { verifyOtpSchema } from "@/lib/schemas"
import { verifyCustomerSignupOtp } from "@/lib/services/customerService"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = verifyOtpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid verification data.", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { email, otp } = parsed.data

    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(`verify_otp_${email}`)
      if (!success) {
        return NextResponse.json(
          { error: "Too many attempts. Please wait a minute and try again." },
          { status: 429 }
        )
      }
    }

    await dbConnect()

    const result = await verifyCustomerSignupOtp({ email, otp })

    return NextResponse.json(
      {
        message: result.alreadyVerified
          ? "Account is already verified. You can log in."
          : "Email verified successfully! You can now access your account.",
        verified: true,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          { error: "No account found with this email. Please sign up." },
          { status: 404 }
        )
      }
      if (error.message === "OTP_EXPIRED") {
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new one." },
          { status: 400 }
        )
      }
      if (error.message === "OTP_MAX_ATTEMPTS") {
        return NextResponse.json(
          {
            error:
              "Maximum verification attempts exceeded. Please request a new code.",
          },
          { status: 429 }
        )
      }
      if (error.message === "INVALID_OTP") {
        return NextResponse.json(
          { error: "Invalid verification code. Please check and try again." },
          { status: 400 }
        )
      }
    }

    console.error("[POST /api/auth/customer/verify-otp]", error)
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    )
  }
}
