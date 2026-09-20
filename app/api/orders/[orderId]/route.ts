import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getOrderForReview } from "@/lib/services/feedbackService"

// ── GET /api/orders/[orderId] ─────────────────────────────────────────────────
// Fetches a single order for the authenticated customer.
// Used by the write-review page to display order details before submission.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const session = await auth()
    if (!session || session.user?.role !== "customer" || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // DB connection is handled inside the service
    const order = await getOrderForReview(orderId, session.user.id)

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("[GET /api/orders/[orderId]]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
