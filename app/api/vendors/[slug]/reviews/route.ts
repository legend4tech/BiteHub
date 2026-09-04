import { NextResponse } from "next/server"
import { getVendorReviews } from "@/lib/services/vendorService"

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
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

    const data = await getVendorReviews(params.slug, options)

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("[GET /api/vendors/[slug]/reviews] Error:", error)
    if (error instanceof Error && error.message === "Vendor not found") {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}
