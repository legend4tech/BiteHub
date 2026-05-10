import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import VendorModel from "@/models/Vendor";
import VendorUserModel from "@/models/VendorUser";
import OrderModel from "@/models/Order";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["admin", "superadmin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
    ]);

    // Build a status → count map
    const byStatus: Record<string, number> = {};
    for (const entry of statusCounts) {
      byStatus[entry._id] = entry.count;
    }

    // Revenue: sum totalAmount for completed orders
    const revenueAgg = await OrderModel.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    return NextResponse.json({
      totalVendors,
      activeVendors,
      totalOrders,
      todayOrders,
      pendingOrders: byStatus["pending"] ?? 0,
      confirmedOrders: byStatus["confirmed"] ?? 0,
      preparingOrders: byStatus["preparing"] ?? 0,
      completedOrders: byStatus["completed"] ?? 0,
      cancelledOrders: byStatus["cancelled"] ?? 0,
      totalRevenue,
    });
  } catch (error) {
    console.error("[admin/stats]", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
