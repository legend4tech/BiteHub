import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { customerSignupSchema } from "@/lib/schemas"
import { initiateCustomerSignup } from "@/lib/services/customerService"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsedBody = customerSignupSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(
        `signup_${parsedBody.data.email}`
      )
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    await dbConnect()

    const result = await initiateCustomerSignup(parsedBody.data)

    return NextResponse.json(
      {
        message: "Verification code sent to your email.",
        email: result.email,
        status: result.status,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "ACCOUNT_EXISTS") {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 }
      )
    }

    if (
      error instanceof Error &&
      error.message === "DISPOSABLE_EMAIL_NOT_ALLOWED"
    ) {
      return NextResponse.json(
        {
          error:
            "Temporary or disposable email addresses are not permitted. Please use your personal or university email.",
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "INVALID_REFERRAL_CODE") {
      return NextResponse.json(
        { error: "The provided referral code is invalid." },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "CANNOT_REFER_SELF") {
      return NextResponse.json(
        { error: "You cannot use your own referral code." },
        { status: 400 }
      )
    }

    console.error("[POST /api/auth/customer/signup]", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
