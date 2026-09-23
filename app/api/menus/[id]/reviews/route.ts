import { NextResponse } from "next/server"
import { getPaginatedMenuItemReviews } from "@/lib/services/menuItemReviewService"

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const ratingFilter = searchParams.get("rating")

    const params = await props.params

    const options: { page: number; limit: number; rating?: number } = {
      page,
      limit,
    }
    if (ratingFilter) {
      options.rating = parseInt(ratingFilter, 10)
    }

    const data = await getPaginatedMenuItemReviews(params.id, options)

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("[GET /api/menus/[id]/reviews] Error:", error)
    if (error instanceof Error && error.message === "Menu item not found") {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}
