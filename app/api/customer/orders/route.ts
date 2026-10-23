import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { serializeOrder } from "@/lib/serializers"
import type { LeanOrder } from "@/lib/serializers"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const status = searchParams.get("status") || "all"
    const skip = (page - 1) * limit

    await dbConnect()

    const baseFilter = session.user.id
      ? {
          $or: [
            { customerId: session.user.id },
            { customerEmail: session.user.email },
          ],
        }
      : { customerEmail: session.user.email }

    const filter: Record<string, unknown> = { ...baseFilter }
    if (status && status !== "all") {
      filter.status = status
    }

    const [orders, totalOrders, statusAggregation] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ])

    const counts: Record<string, number> = { all: 0 }
    let totalAll = 0
    for (const item of statusAggregation) {
      if (item._id) {
        counts[item._id] = item.count
        totalAll += item.count
      }
    }
    counts["all"] = totalAll

    const serializedOrders = orders.map((order) =>
      serializeOrder(order as unknown as LeanOrder)
    )

    return NextResponse.json({
      orders: serializedOrders,
      page,
      hasMore: skip + orders.length < totalOrders,
      totalOrders,
      counts,
    })
  } catch (error) {
    console.error("[GET /api/customer/orders] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch customer orders" },
      { status: 500 }
    )
  }
}
