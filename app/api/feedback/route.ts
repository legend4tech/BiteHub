import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { feedbackSchema } from "@/lib/schemas"
import { strictRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit"
import {
  submitCustomerFeedback,
  submitPlatformFeedback,
} from "@/lib/services/feedbackService"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting by User ID
    if (isRateLimitingEnabled) {
      const userId = session.user.id
      const { success } = await strictRateLimiter.limit(`feedback_${userId}`)
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    const body = await request.json()
    const parsedBody = feedbackSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const { orderId, vendorId, platform, customerReview } = parsedBody.data

    // ─── Legacy Platform Feedback ──────────────────────────────────────────
    if (platform) {
      const result = await submitPlatformFeedback(platform, orderId, vendorId)
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status }
        )
      }
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // ─── New Customer Review Flow ─────────────────────────────────────────
    if (customerReview && session.user?.role === "customer") {
      const customerId = session.user.id
      const result = await submitCustomerFeedback(customerReview, customerId)
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status }
        )
      }
      return NextResponse.json({ success: true }, { status: 201 })
    }

    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  } catch (error) {
    console.error("[POST /api/feedback]", error)
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    )
  }
}
