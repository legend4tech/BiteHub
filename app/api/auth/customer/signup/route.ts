import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { customerSignupSchema } from "@/lib/schemas"
import { registerOrClaimCustomer } from "@/lib/services/customerService"

export async function POST(request: Request) {
  try {
    await dbConnect()

    const body = await request.json()
    const parsedBody = customerSignupSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const result = await registerOrClaimCustomer(parsedBody.data)

    if (result.claimed) {
      return NextResponse.json(
        { message: "Account successfully claimed and created." },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { message: "Account successfully created." },
      { status: 201 }
    )
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "ACCOUNT_EXISTS") {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 }
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
