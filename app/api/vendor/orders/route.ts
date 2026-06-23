import { NextResponse } from "next/server"
import { Types, type PipelineStage } from "mongoose"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { auth } from "@/auth"
import { serializeOrder } from "@/lib/serializers"

/**
 * GET /api/vendor/orders
 * Returns orders for the authenticated vendor with a priority sort:
 * paid orders (paymentStatus: "paid") appear first, then unpaid —
 * both tiers ordered newest-first by createdAt.
 *
 * Used by the vendor dashboard (limit: 10) and the useVendorOrders hook.
 *
 * Query params:
 *  - status: filter by order status (or "all" to skip)
 *  - limit: max number of orders to return (default: no limit)
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      session.user?.role !== "vendor" ||
      !session.user?.vendorId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendorId = new Types.ObjectId(session.user.vendorId)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "0", 10)

    const query: Record<string, unknown> = {
      vendorId,
    }
    if (status && status !== "all") {
      query.status = status
    }

    // Smart priority sort: paid orders first, then newest first within each tier
    const pipeline: PipelineStage[] = [
      { $match: query },
      {
        $addFields: {
          _sortPriority: {
            $cond: [{ $eq: ["$paymentStatus", "paid"] }, 0, 1],
          },
        },
      },
      { $sort: { _sortPriority: 1, createdAt: -1 } },
    ]
    if (limit > 0) {
      pipeline.push({ $limit: limit })
    }

    const orders = await Order.aggregate(pipeline)
    return NextResponse.json(orders.map(serializeOrder))
  } catch (error) {
    console.error("[vendor/orders GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/vendor/orders/[id]
 * Update an order status. Handled per-order in a separate route file.
 */
