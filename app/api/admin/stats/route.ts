import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import OrderModel from "@/models/Order"
import { auth } from "@/auth"
import { ORDER_STATUS } from "@/lib/constants"

export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )

    const [
      totalVendors,
      activeVendors,
      totalOrders,
      todayOrders,
      statusCounts,
    ] = await Promise.all([
      VendorModel.countDocuments({}),
      VendorModel.countDocuments({ isActive: true }),
      OrderModel.countDocuments({}),
      OrderModel.countDocuments({ createdAt: { $gte: todayStart } }),
      OrderModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ])

    // Build a status → count map
    const byStatus: Record<string, number> = {}
    for (const entry of statusCounts) {
      byStatus[entry._id] = entry.count
    }

    // Revenue: sum totalAmount for completed orders
    const revenueAgg = await OrderModel.aggregate([
      { $match: { status: ORDER_STATUS.COMPLETED } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])
    const totalRevenue = revenueAgg[0]?.total ?? 0

    return NextResponse.json({
      totalVendors,
      activeVendors,
      totalOrders,
      todayOrders,
      pendingOrders: byStatus[ORDER_STATUS.PENDING] ?? 0,
      confirmedOrders: byStatus[ORDER_STATUS.CONFIRMED] ?? 0,
      preparingOrders: byStatus[ORDER_STATUS.PREPARING] ?? 0,
      completedOrders: byStatus[ORDER_STATUS.COMPLETED] ?? 0,
      cancelledOrders: byStatus[ORDER_STATUS.CANCELLED] ?? 0,
      totalRevenue,
    })
  } catch (error) {
    console.error("[admin/stats]", error)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
