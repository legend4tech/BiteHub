/**
 * feedbackService.ts
 *
 * Single source of truth for all feedback DB queries.
 * Used by /api/feedback and /api/customer/reviews.
 */

import dbConnect from "@/lib/db"
import PlatformFeedback from "@/models/PlatformFeedback"
import VendorFeedback from "@/models/VendorFeedback"
import MenuItemFeedback, { IMenuItemFeedback } from "@/models/MenuItemFeedback"
import Vendor from "@/models/Vendor"
import MenuItem from "@/models/MenuItem"
import Order, { IOrderItem } from "@/models/Order"
import { syncVendorMenuScores } from "@/lib/services/scoreService"
import { ORDER_STATUS } from "@/lib/constants"
import { serializeOrder, serializeVendorFeedback } from "@/lib/serializers"
import type { LeanOrder, PopulatedVendorFeedback } from "@/lib/serializers"
import type { Types } from "mongoose"
import type { FeedbackValues } from "@/lib/schemas"
import { sendVendorNewReviewEmail } from "@/lib/vendorAlertMail"

// ─── Section: Customer Feedback ──────────────────────────────────────────

export async function submitCustomerFeedback(
  customerReview: NonNullable<FeedbackValues["customerReview"]>,
  customerId: string
) {
  await dbConnect()

  const order = await Order.findOne({ orderId: customerReview.orderId })
  if (!order) {
    return { error: "Order not found", status: 404 }
  }

  if (order.customerId?.toString() !== customerId) {
    return { error: "Unauthorized", status: 403 }
  }

  if (order.status !== ORDER_STATUS.COMPLETED) {
    return { error: "Order must be completed before reviewing.", status: 400 }
  }

  if (order.isRated) {
    return { error: "This order has already been fully reviewed.", status: 409 }
  }

  const validItemReviews = (customerReview.itemReviews || []).filter(
    (ir) => ir.rating && ir.rating > 0
  )
  const validVendorRating =
    customerReview.vendorRating && customerReview.vendorRating > 0

  if (!validVendorRating && validItemReviews.length === 0) {
    return {
      error: "Please rate at least one item or the vendor.",
      status: 400,
    }
  }

  // Upsert Vendor Feedback (if provided)
  if (validVendorRating) {
    const existingVendorFeedback = await VendorFeedback.findOne({
      vendorId: customerReview.vendorId,
      customerId,
    })

    if (existingVendorFeedback) {
      existingVendorFeedback.rating = customerReview.vendorRating
      existingVendorFeedback.orderId = customerReview.orderId
      existingVendorFeedback.isAnonymous = customerReview.isAnonymous || false
      await existingVendorFeedback.save()
    } else {
      await VendorFeedback.create({
        vendorId: customerReview.vendorId,
        customerId,
        orderId: customerReview.orderId,
        rating: customerReview.vendorRating,
        isAnonymous: customerReview.isAnonymous || false,
      })
    }

    // Recalculate Vendor Aggregate Rating
    const allVendorFeedback = await VendorFeedback.find({
      vendorId: customerReview.vendorId,
    })
      .select("rating")
      .lean()
    if (allVendorFeedback.length > 0) {
      const totalRating = allVendorFeedback.reduce(
        (sum: number, f: { rating: number }) => sum + f.rating,
        0
      )
      const avgRating = totalRating / allVendorFeedback.length
      await Vendor.findByIdAndUpdate(customerReview.vendorId, {
        $set: { rating: avgRating, ratingCount: allVendorFeedback.length },
      })
      await syncVendorMenuScores(customerReview.vendorId)
    }

    order.isVendorRated = true
  }

  // Upsert MenuItem Feedback for each reviewed item
  if (validItemReviews.length > 0) {
    for (const itemReview of validItemReviews) {
      const existingItemFeedback = await MenuItemFeedback.findOne({
        menuItemId: itemReview.menuItemId,
        customerId,
      })

      if (existingItemFeedback) {
        existingItemFeedback.rating = itemReview.rating
        existingItemFeedback.title = itemReview.title
        existingItemFeedback.comments = itemReview.comments
        existingItemFeedback.isAnonymous = customerReview.isAnonymous || false
        existingItemFeedback.orderId = customerReview.orderId
        await existingItemFeedback.save()
      } else {
        await MenuItemFeedback.create({
          menuItemId: itemReview.menuItemId,
          orderId: customerReview.orderId,
          customerId,
          vendorId: customerReview.vendorId,
          rating: itemReview.rating,
          title: itemReview.title,
          comments: itemReview.comments,
          isAnonymous: customerReview.isAnonymous || false,
        })
      }

      // Recalculate MenuItem Aggregate Rating
      const allItemFeedback = await MenuItemFeedback.find({
        menuItemId: itemReview.menuItemId,
      })
        .select("rating")
        .lean()
      if (allItemFeedback.length > 0) {
        const totalItemRating = allItemFeedback.reduce(
          (sum: number, f: { rating: number }) => sum + f.rating,
          0
        )
        const avgItemRating = totalItemRating / allItemFeedback.length
        await MenuItem.findByIdAndUpdate(itemReview.menuItemId, {
          $set: { rating: avgItemRating, ratingCount: allItemFeedback.length },
        })
      }

      if (!order.ratedItems) {
        order.ratedItems = []
      }
      if (!order.ratedItems.includes(itemReview.menuItemId)) {
        order.ratedItems.push(itemReview.menuItemId)
      }
    }
  }

  // Check if order is fully rated
  const allItemsRated = order.items.every((item: IOrderItem) =>
    order.ratedItems?.includes(item.menuItemId)
  )

  if (order.isVendorRated && allItemsRated) {
    order.isRated = true
  }

  // Use updateOne with strict: false to bypass any hot-reload cached schema issues
  // that would silently strip out newly added fields (like isVendorRated).
  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        isVendorRated: order.isVendorRated,
        isRated: order.isRated,
        ratedItems: order.ratedItems,
      },
    },
    { strict: false }
  )
  // ─── Email 1: Vendor just rated ──────────────────────────────────────────
  // Fires immediately when the customer submits their vendor rating.
  if (validVendorRating && order.isVendorRated) {
    const vendor = await Vendor.findById(customerReview.vendorId)
      .select("name")
      .lean()
    if (vendor) {
      sendVendorNewReviewEmail(
        customerReview.vendorId,
        vendor.name,
        customerReview.vendorRating,
        undefined // No item reviews yet at this point
      ).catch((err) => console.error("Error sending vendor rating email:", err))
    }
  }

  // ─── Email 2: All items rated ─────────────────────────────────────────────
  // Fires only when the customer has finished rating every item in the order.
  if (allItemsRated && validItemReviews.length > 0) {
    const vendor = await Vendor.findById(customerReview.vendorId)
      .select("name")
      .lean()
    if (vendor) {
      // Fetch the real stored vendor rating — the incoming vendorRating may be 0
      // if the customer submitted items without re-rating the vendor.
      const vendorFeedback = await VendorFeedback.findOne({
        orderId: customerReview.orderId,
        vendorId: customerReview.vendorId,
      })
        .select("rating")
        .lean()

      const allItemFeedback = await MenuItemFeedback.find({
        orderId: customerReview.orderId,
        vendorId: customerReview.vendorId,
      })
        .select("menuItemId rating title comments")
        .lean()

      let emailItemReviews:
        | {
            itemName: string
            rating: number
            title: string
            comments?: string
          }[]
        | undefined
      if (allItemFeedback.length > 0) {
        const itemIds = allItemFeedback.map((f) => f.menuItemId)
        const menuItems = await MenuItem.find({ _id: { $in: itemIds } })
          .select("name")
          .lean()
        const itemMap = new Map(
          menuItems.map((item) => [item._id.toString(), item.name])
        )
        emailItemReviews = allItemFeedback.map((f) => ({
          itemName: itemMap.get(f.menuItemId.toString()) || "Unknown Item",
          rating: f.rating,
          title: f.title ?? "",
          comments: f.comments,
        }))
      }

      sendVendorNewReviewEmail(
        customerReview.vendorId,
        vendor.name,
        vendorFeedback?.rating ?? 0,
        emailItemReviews
      ).catch((err) => console.error("Error sending item reviews email:", err))
    }
  }

  return { success: true }
}

export async function submitPlatformFeedback(
  platform: NonNullable<FeedbackValues["platform"]>,
  orderId?: string,
  vendorId?: string
) {
  await dbConnect()

  if (orderId) {
    const existingPlatformFeedback = await PlatformFeedback.findOne({ orderId })
    if (existingPlatformFeedback) {
      return {
        error: "Feedback has already been submitted for this order.",
        status: 400,
      }
    }
  }

  await PlatformFeedback.create({
    orderId,
    vendorId,
    rating: platform.rating,
    comments: platform.comments,
  })

  return { success: true }
}

// ─── Section: Customer Reviews Listing ───────────────────────────────────

export async function getCustomerPendingReviews(customerId: string) {
  await dbConnect()

  const pendingOrders = await Order.find({
    customerId,
    status: ORDER_STATUS.COMPLETED,
    isRated: false,
  })
    .populate("vendorId", "name image slug")
    .sort({ createdAt: -1 })
    .lean<
      (LeanOrder & {
        vendorId: {
          _id: Types.ObjectId
          name: string
          slug: string
          image?: { url: string }
        } | null
      })[]
    >()

  return pendingOrders.map((o) => ({
    ...serializeOrder(o),
    vendor: o.vendorId
      ? {
          id: o.vendorId._id?.toString(),
          name: o.vendorId.name,
          image: o.vendorId.image,
          slug: o.vendorId.slug,
        }
      : null,
  }))
}

export async function getCustomerCompletedReviews(customerId: string) {
  await dbConnect()

  const completedReviews = await VendorFeedback.find({ customerId })
    .populate("vendorId", "name image slug")
    .sort({ updatedAt: -1 })
    .lean<PopulatedVendorFeedback[]>()

  return {
    completed: completedReviews.map((f) => serializeVendorFeedback(f)),
    completedWithVendor: completedReviews.map((f) => ({
      ...serializeVendorFeedback(f),
      vendor: f.vendorId
        ? {
            id: f.vendorId._id.toString(),
            name: f.vendorId.name,
            image: f.vendorId.image,
            slug: f.vendorId.slug,
          }
        : null,
    })),
  }
}

type PopulatedReviewOrder = LeanOrder & {
  vendorId: {
    _id: Types.ObjectId
    name: string
    slug: string
    image?: { url: string }
  } | null
}

/**
 * Fetch a single order by orderId, scoped to the authenticated customer.
 * Used by the write-review page to display order details before submission.
 */
export async function getOrderForReview(orderId: string, customerId: string) {
  await dbConnect()

  const rawOrder = await Order.findOne({ orderId, customerId })
    .populate("vendorId", "name image slug")
    .lean()

  if (!rawOrder) return null

  const order = rawOrder as unknown as PopulatedReviewOrder

  // Fetch existing item reviews to allow editing
  const existingItemReviewsRaw = await MenuItemFeedback.find({
    orderId,
    customerId,
  }).lean()
  const existingItemReviews = existingItemReviewsRaw.map((r) => ({
    menuItemId: r.menuItemId.toString(),
    rating: r.rating,
    title: r.title,
    comments: r.comments,
    isAnonymous: r.isAnonymous,
    createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
  }))

  return {
    ...serializeOrder(order as unknown as LeanOrder),
    vendor: order.vendorId
      ? {
          id: order.vendorId._id?.toString(),
          name: order.vendorId.name,
          image: order.vendorId.image,
          slug: order.vendorId.slug,
        }
      : null,
    existingItemReviews,
  }
}
