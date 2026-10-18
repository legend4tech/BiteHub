import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { resendOtpSchema } from "@/lib/schemas"
import { resendCustomerVerificationOtp } from "@/lib/services/customerService"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = resendOtpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address.", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(`resend_otp_${email}`)
      if (!success) {
        return NextResponse.json(
          {
            error:
              "Too many code requests. Please wait a few minutes before trying again.",
          },
          { status: 429 }
        )
      }
    }

    await dbConnect()

    await resendCustomerVerificationOtp(email)

    return NextResponse.json(
      { message: "A fresh verification code has been sent to your email." },
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
      if (error.message === "ALREADY_VERIFIED") {
        return NextResponse.json(
          { error: "This account is already verified. Please log in." },
          { status: 400 }
        )
      }
      if (error.message === "RESEND_COOLDOWN") {
        return NextResponse.json(
          {
            error:
              "Please wait at least 60 seconds before requesting a new code.",
          },
          { status: 429 }
        )
      }
    }

    console.error("[POST /api/auth/customer/resend-otp]", error)
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    )
  }
}
