/**
 * menuItemReviewService.ts
 *
 * Handles all read-side DB queries for menu item reviews.
 * Used by /api/menu/[id]/reviews (React Query) and server pages.
 *
 * Write-side (submitting reviews) lives in feedbackService.ts.
 */

import dbConnect from "@/lib/db"
import MenuItemFeedback, { IMenuItemFeedback } from "@/models/MenuItemFeedback"
import MenuItem from "@/models/MenuItem"

export async function getMenuItemReviews(menuItemId: string) {
  await dbConnect()

  // After .populate(), customerId is projected to { name, image } at runtime.
  // We define a local type to capture this rather than using any[].
  type PopulatedReview = Omit<IMenuItemFeedback, "customerId"> & {
    _id: import("mongoose").Types.ObjectId
    customerId: { name: string; image?: string } | null
    createdAt?: Date
  }

  const reviews = (await MenuItemFeedback.find({ menuItemId })
    .populate("customerId", "name image")
    .sort({ createdAt: -1 })
    .lean()) as unknown as PopulatedReview[]

  return reviews.map((r) => ({
    id: r._id.toString(),
    rating: r.rating,
    title: r.title,
    comments: r.comments,
    isAnonymous: r.isAnonymous,
    createdAt: r.createdAt
      ? r.createdAt.toISOString()
      : new Date().toISOString(),
    customer:
      r.isAnonymous || !r.customerId
        ? null
        : {
            name: r.customerId.name,
            // Customer.image is stored as a plain string; wrap as { url } to match Review type
            image: r.customerId.image ? { url: r.customerId.image } : undefined,
          },
  }))
}

export async function getPaginatedMenuItemReviews(
  menuItemId: string,
  options: { page?: number; limit?: number; rating?: number } = {}
) {
  await dbConnect()

  const page = Math.max(1, options.page || 1)
  const limit = Math.max(1, Math.min(50, options.limit || 10))
  const skip = (page - 1) * limit

  // We need to fetch the reviews for the specific menu item
  // using the same schema as VendorFeedback
  // Let's first ensure MenuItem exists
  const menuItem = await MenuItem.findById(menuItemId).lean()
  if (!menuItem) {
    throw new Error("Menu item not found")
  }

  const matchQuery: Record<string, unknown> = { menuItemId: menuItem._id }
  if (options.rating) {
    matchQuery.rating = options.rating
  }

  const reviews = await MenuItemFeedback.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customerData",
      },
    },
    {
      $unwind: {
        path: "$customerData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        id: "$_id",
        _id: 0,
        rating: 1,
        title: 1,
        comments: 1,
        createdAt: 1,
        isAnonymous: 1,
        customerName: {
          $cond: {
            if: { $eq: ["$isAnonymous", true] },
            then: "Anonymous",
            else: { $ifNull: ["$customerData.name", "Verified Buyer"] },
          },
        },
        customerImage: {
          $cond: {
            if: { $eq: ["$isAnonymous", true] },
            then: null,
            else: "$customerData.image",
          },
        },
      },
    },
  ])

  let statistics = null
  if (page === 1) {
    const distributionAgg = await MenuItemFeedback.aggregate([
      { $match: { menuItemId: menuItem._id } },
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

  // Convert Date objects to strings since we are returning to the client/server component
  const serializedReviews = reviews.map(
    (r: {
      id: { toString: () => string }
      createdAt?: Date
      [key: string]: unknown
    }) => ({
      ...r,
      id: r.id.toString(),
      createdAt: r.createdAt?.toISOString() || null,
    })
  )

  return {
    reviews: serializedReviews,
    page,
    hasMore: reviews.length === limit,
    ...(statistics && { statistics }),
  }
}
