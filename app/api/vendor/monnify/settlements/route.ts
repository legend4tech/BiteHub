import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import Order from "@/models/Order"
import { serializeOrder, type LeanOrder } from "@/lib/serializers"

export const dynamic = "force-dynamic"

/**
 * GET /api/vendor/monnify/settlements
 * Returns a summary of the vendor's earnings from our order database.
 * Shows: pending (unpaid orders), confirmed (paid but not yet settled),
 * and completed orders — grouped so vendor knows their financial position.
 */
export async function GET() {
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

    const { Types } = await import("mongoose")
    const vendorId = new Types.ObjectId(session.user.vendorId)

    // Aggregate vendor revenue across all payment states
    const [summary] = await Order.aggregate([
      { $match: { vendorId, paymentStatus: "paid" } },
      {
        $group: {
          _id: "$status",
          totalRevenue: { $sum: "$vendorRevenue" },
          count: { $sum: 1 },
        },
      },
    ])

    // Get recent paid orders for the timeline view
    const recentOrders = await Order.find({ vendorId, paymentStatus: "paid" })
      .select("orderId status vendorRevenue totalAmount createdAt customerName")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    // Aggregate totals
    const [totals] = await Order.aggregate([
      { $match: { vendorId, paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: "$vendorRevenue" },
          totalOrders: { $sum: 1 },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$vendorRevenue", 0],
            },
          },
          pendingRevenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["confirmed", "preparing", "ready"]] },
                "$vendorRevenue",
                0,
              ],
            },
          },
        },
      },
    ])

    return NextResponse.json({
      totalEarned: totals?.totalEarned || 0,
      totalOrders: totals?.totalOrders || 0,
      completedRevenue: totals?.completedRevenue || 0,
      pendingRevenue: totals?.pendingRevenue || 0,
      recentOrders: recentOrders.map((o) =>
        serializeOrder(o as unknown as LeanOrder)
      ),
      settlementNote:
        "Monnify settles your sub-account on the next business day (T+1). Funds appear in your bank account 1-2 business days after settlement.",
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    console.error("[vendor/monnify/settlements GET]", errMsg)
    return NextResponse.json(
      { error: "Failed to fetch settlements" },
      { status: 500 }
    )
  }
}
