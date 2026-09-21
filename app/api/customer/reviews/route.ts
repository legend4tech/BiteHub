import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { customerReviewsTabSchema } from "@/lib/schemas"
import { strictRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit"
import {
  getCustomerPendingReviews,
  getCustomerCompletedReviews,
} from "@/lib/services/feedbackService"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting by User ID
    if (isRateLimitingEnabled) {
      const userId = session.user.id
      const { success } = await strictRateLimiter.limit(`reviews_get_${userId}`)
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const rawTab = searchParams.get("tab") || "pending"
    const parsedTab = customerReviewsTabSchema.safeParse(rawTab)

    if (!parsedTab.success) {
      return NextResponse.json(
        { error: "Invalid tab parameter" },
        { status: 400 }
      )
    }

    const tab = parsedTab.data
    const customerId = session.user.id

    if (tab === "pending") {
      const pendingOrders = await getCustomerPendingReviews(customerId)
      return NextResponse.json(
        {
          success: true,
          pending: pendingOrders,
          completed: [],
          completedWithVendor: [],
        },
        { status: 200 }
      )
    } else {
      const result = await getCustomerCompletedReviews(customerId)
      return NextResponse.json(
        {
          success: true,
          pending: [],
          completed: result.completed,
          completedWithVendor: result.completedWithVendor,
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("[GET /api/customer/reviews]", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}
