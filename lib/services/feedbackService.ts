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
import Order from "@/models/Order"
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
    return { error: "This order has already been reviewed.", status: 409 }
  }

  // Upsert Vendor Feedback (Overwrite Rule)
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

  // Upsert MenuItem Feedback for each reviewed item
  if (customerReview.itemReviews && customerReview.itemReviews.length > 0) {
    for (const itemReview of customerReview.itemReviews) {
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
    }
  } else {
    // Fallback if no item reviews are provided (shouldn't happen with updated schema)
    // We could leave it empty or do nothing.
  }

  // Lock the order
  await Order.findByIdAndUpdate(order._id, { $set: { isRated: true } })

  // Send email to vendor
  const vendor = await Vendor.findById(customerReview.vendorId)
    .select("name")
    .lean()
  if (vendor) {
    let emailItemReviews = undefined
    if (customerReview.itemReviews && customerReview.itemReviews.length > 0) {
      const itemIds = customerReview.itemReviews.map((ir) => ir.menuItemId)
      const menuItems = await MenuItem.find({ _id: { $in: itemIds } })
        .select("name")
        .lean()
      const itemMap = new Map(
        menuItems.map((item) => [item._id.toString(), item.name])
      )

      emailItemReviews = customerReview.itemReviews.map((ir) => ({
        itemName: itemMap.get(ir.menuItemId) || "Unknown Item",
        rating: ir.rating,
        title: ir.title,
        comments: ir.comments,
      }))
    }

    sendVendorNewReviewEmail(
      customerReview.vendorId,
      vendor.name,
      customerReview.vendorRating,
      emailItemReviews
    ).catch((err) => console.error("Error sending vendor review email:", err))
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
  }
}

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
