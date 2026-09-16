/**
 * orderService.ts
 *
 * Single source of truth for all vendor order DB queries.
 * Used by:
 *   - /vendor/orders (Server Component — paginated order list page)
 *   - Consumed server-side only; client-side fetching goes through /api/vendor/orders
 */

import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { serializeOrder, type LeanOrder } from "@/lib/serializers"
import { Types } from "mongoose"
import type mongoose from "mongoose"
import type { Order as OrderType } from "@/types/shared"

export interface GetVendorOrdersOptions {
  vendorId: string | mongoose.Types.ObjectId
  status?: string
  q?: string
  page?: number
  limit?: number
}

/**
 * Fetches a paginated, priority-sorted list of orders for a vendor.
 *
 * Sort order: paid orders (paymentStatus: "paid") always appear first,
 * then unpaid orders — both tiers sorted newest-first by createdAt.
 *
 * NOTE: Uses aggregate() — vendorId MUST be cast to ObjectId before use
 * since aggregate() does not auto-cast types like find() does.
 */
export async function getVendorOrdersPaginated(
  options: GetVendorOrdersOptions
) {
  const { vendorId, status = "all", q = "", page = 1, limit = 20 } = options

  await dbConnect()

  // Aggregate does NOT auto-cast types — must explicitly convert to ObjectId
  // so $match correctly compares against the vendorId ObjectId field in MongoDB.
  const vendorObjectId =
    vendorId instanceof Types.ObjectId ? vendorId : new Types.ObjectId(vendorId)

  const baseMatch: Record<string, unknown> = { vendorId: vendorObjectId }

  if (q) {
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    baseMatch.$or = [
      { orderId: { $regex: escapedQuery, $options: "i" } },
      { customerName: { $regex: escapedQuery, $options: "i" } },
    ]
  }

  // Use aggregation to efficiently get counts by status
  const countsByStatus = await Order.aggregate([
    { $match: baseMatch },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ])

  // Convert array to a record
  const counts = countsByStatus.reduce(
    (acc, curr) => {
      acc[curr._id] = curr.count
      return acc
    },
    {} as Record<string, number>
  )

  const totalOrdersCount = countsByStatus.reduce(
    (acc, curr) => acc + curr.count,
    0
  )
  counts["all"] = totalOrdersCount

  const currentStatusCount = counts[status] || 0
  const totalPages = Math.max(1, Math.ceil(currentStatusCount / limit))
  const skip = (page - 1) * limit

  // Fetch paginated orders with smart priority sort:
  //   Priority 0 → paid orders (paymentStatus: "paid")   — always first
  //   Priority 1 → unpaid orders                          — last
  // Within each priority tier, newest order comes first.
  const pipelineMatch = { ...baseMatch }
  if (status !== "all") {
    pipelineMatch.status = status
  }

  const ordersDocs = await Order.aggregate([
    { $match: pipelineMatch },
    {
      $addFields: {
        _sortPriority: {
          $cond: [{ $eq: ["$paymentStatus", "paid"] }, 0, 1],
        },
      },
    },
    { $sort: { _sortPriority: 1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ])

  const orders = ordersDocs
    .map((doc) => serializeOrder(doc as LeanOrder))
    .filter(Boolean) as OrderType[]

  return { orders, counts, totalPages }
}

/**
 * Fetches recent orders for a customer (used for dashboard).
 */
export async function getRecentCustomerOrders(email: string, limit = 3) {
  await dbConnect()
  const ordersDocs = await Order.find({ customerEmail: email })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return ordersDocs
    .map((doc) => serializeOrder(doc as LeanOrder))
    .filter(Boolean) as OrderType[]
}

/**
 * Fetches total order count for a customer.
 */
export async function getCustomerOrdersCount(email: string) {
  await dbConnect()
  return Order.countDocuments({ customerEmail: email })
}

/**
 * Fetches paginated orders for a customer.
 */
export async function getCustomerOrdersPaginated(
  email: string,
  page = 1,
  limit = 20
) {
  await dbConnect()
  const skip = (page - 1) * limit

  const [ordersDocs, totalOrders] = await Promise.all([
    Order.find({ customerEmail: email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({ customerEmail: email }),
  ])

  const orders = ordersDocs
    .map((doc) => serializeOrder(doc as LeanOrder))
    .filter(Boolean) as OrderType[]

  return {
    orders,
    totalOrders,
    hasMore: skip + ordersDocs.length < totalOrders,
  }
}
