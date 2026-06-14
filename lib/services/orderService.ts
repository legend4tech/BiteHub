/**
 * orderService.ts
 *
 * Single source of truth for all order DB queries.
 */

import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { serializeOrder, type LeanOrder } from "@/lib/serializers"
import type mongoose from "mongoose"
import type { Order as OrderType } from "@/lib/types"

export interface GetVendorOrdersOptions {
  vendorId: string | mongoose.Types.ObjectId
  status?: string
  q?: string
  page?: number
  limit?: number
}

export async function getVendorOrdersPaginated(
  options: GetVendorOrdersOptions
) {
  const { vendorId, status = "all", q = "", page = 1, limit = 20 } = options

  await dbConnect()

  const baseMatch: Record<string, unknown> = { vendorId }

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

  // Fetch only the paginated orders
  const query = { ...baseMatch }
  if (status !== "all") {
    query.status = status
  }

  const ordersDocs = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const orders = ordersDocs
    .map((doc) => serializeOrder(doc as LeanOrder))
    .filter(Boolean) as OrderType[]

  return { orders, counts, totalPages }
}
