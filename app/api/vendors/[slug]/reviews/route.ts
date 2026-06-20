import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import VendorFeedback from "@/models/VendorFeedback"

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.max(
      1,
      Math.min(50, parseInt(searchParams.get("limit") || "10", 10))
    )
    const skip = (page - 1) * limit
    const params = await props.params

    const vendor = await Vendor.findOne({ slug: params.slug }).lean()
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const ratingFilter = searchParams.get("rating")
    const matchQuery: Record<string, unknown> = { vendorId: vendor._id }
    if (ratingFilter) {
      matchQuery.rating = parseInt(ratingFilter, 10)
    }

    // Use aggregation to lookup the customer name from the Order collection
    const reviews = await VendorFeedback.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "orderId",
          as: "orderData",
        },
      },
      {
        $unwind: {
          path: "$orderData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$_id",
          _id: 0,
          rating: 1,
          comments: 1,
          createdAt: 1,
          isAnonymous: 1,
          customerName: {
            $cond: {
              if: { $eq: ["$isAnonymous", true] },
              then: "Anonymous",
              else: { $ifNull: ["$orderData.customerName", "Verified Buyer"] },
            },
          },
        },
      },
    ])

    let statistics = null
    if (page === 1) {
      const distributionAgg = await VendorFeedback.aggregate([
        { $match: { vendorId: vendor._id } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ])

      let calculatedTotal = 0
      let calculatedStars = 0
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

      distributionAgg.forEach((d) => {
        if (d._id >= 1 && d._id <= 5) {
          distribution[d._id as keyof typeof distribution] = d.count
          calculatedTotal += d.count
          calculatedStars += d._id * d.count
        }
      })

      statistics = {
        averageRating:
          calculatedTotal > 0 ? calculatedStars / calculatedTotal : 0,
        totalReviews: calculatedTotal,
        distribution,
      }
    }

    return NextResponse.json({
      reviews,
      page,
      hasMore: reviews.length === limit,
      ...(statistics && { statistics }),
    })
  } catch (error) {
    console.error("[GET /api/vendors/[slug]/reviews] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}
