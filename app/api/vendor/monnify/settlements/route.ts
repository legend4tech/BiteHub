import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { serializeOrder, type LeanOrder } from "@/lib/serializers"
import { ORDER_STATUS } from "@/lib/constants"
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
    await await Order.aggregate([
      { $match: { vendorId, paymentStatus: "paid" } },
      {
        $group: {
          _id: "$status",
          totalRevenueInKobo: { $sum: "$vendorRevenueInKobo" },
          count: { $sum: 1 },
        },
      },
    ])
    // Get recent paid orders for the timeline view
    const recentOrders = await Order.find({ vendorId, paymentStatus: "paid" })
      .select(
        "orderId status vendorRevenueInKobo totalAmountInKobo createdAt customerName"
      )
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
    // Aggregate totals
    const [totals] = await Order.aggregate([
      { $match: { vendorId, paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalEarnedInKobo: { $sum: "$vendorRevenueInKobo" },
          totalOrders: { $sum: 1 },
          completedRevenueInKobo: {
            $sum: {
              $cond: [
                { $eq: ["$status", ORDER_STATUS.COMPLETED] },
                "$vendorRevenueInKobo",
                0,
              ],
            },
          },
          pendingRevenueInKobo: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [
                      ORDER_STATUS.CONFIRMED,
                      ORDER_STATUS.PREPARING,
                      ORDER_STATUS.READY,
                    ],
                  ],
                },
                "$vendorRevenueInKobo",
                0,
              ],
            },
          },
        },
      },
    ])
    return NextResponse.json({
      totalEarnedInKobo: totals?.totalEarnedInKobo || 0,
      totalOrders: totals?.totalOrders || 0,
      completedRevenueInKobo: totals?.completedRevenueInKobo || 0,
      pendingRevenueInKobo: totals?.pendingRevenueInKobo || 0,
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
