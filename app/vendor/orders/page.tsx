import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { serializeOrder } from "@/lib/serializers"
import { VendorOrders } from "@/components/vendor/VendorOrders"
import { Types } from "mongoose"
import { redirect } from "next/navigation"
import type { Order as OrderType } from "@/lib/types"

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>
}) {
  const session = await auth()
  if (!session || session.user?.role !== "vendor" || !session.user?.vendorId) {
    redirect("/vendor/login")
  }

  await dbConnect()
  const vendorId = new Types.ObjectId(session.user.vendorId)

  const resolvedSearchParams = await searchParams
  const activeStatus = resolvedSearchParams.status || "all"
  const searchQuery = resolvedSearchParams.q || ""
  const page = parseInt(resolvedSearchParams.page || "1", 10)
  const limit = 20

  const baseMatch: Record<string, unknown> = { vendorId }

  if (searchQuery) {
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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

  const currentStatusCount = counts[activeStatus] || 0
  const totalPages = Math.max(1, Math.ceil(currentStatusCount / limit))
  const skip = (page - 1) * limit

  // Fetch only the paginated orders
  const query = { ...baseMatch }
  if (activeStatus !== "all") {
    query.status = activeStatus
  }

  const ordersDocs = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const orders = ordersDocs.map(serializeOrder).filter(Boolean) as OrderType[]

  return (
    <VendorOrders
      orders={orders}
      counts={counts}
      activeStatus={activeStatus}
      currentPage={page}
      totalPages={totalPages}
      searchQuery={searchQuery}
    />
  )
}
