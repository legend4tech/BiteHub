import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import OrderModel from "@/models/Order"
import MenuItemModel from "@/models/MenuItem"
import PlatformWithdrawal from "@/models/PlatformWithdrawal"
import Wallet from "@/models/Wallet"
import { auth } from "@/auth"
import { ORDER_STATUS } from "@/lib/constants"
import { getMonnifyWalletBalance } from "@/lib/monnify"
import { nairaToKobo } from "@/lib/money"

export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin", "vendor_manager"].includes(
        session.user?.role || ""
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Calculate todayStart in Nigerian time (UTC+1)
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
    const parts = formatter.formatToParts(now)
    const tzYear = Number(parts.find((p) => p.type === "year")?.value)
    const tzMonth = Number(parts.find((p) => p.type === "month")?.value) - 1 // 0-indexed
    const tzDay = Number(parts.find((p) => p.type === "day")?.value)

    // Create Date object for midnight Nigerian time in UTC
    const todayStart = new Date(Date.UTC(tzYear, tzMonth, tzDay, -1, 0, 0))

    const [
      totalVendors,
      activeVendors,
      totalOrders,
      todayOrders,
      statusCounts,
      monnifyBalance,
      vendorIdsWithMenus,
      withdrawalAgg,
      walletLiabilitiesAgg,
      vendorWalletAgg,
    ] = await Promise.all([
      VendorModel.countDocuments({}),
      VendorModel.countDocuments({ isActive: true }),
      OrderModel.countDocuments({}),
      OrderModel.countDocuments({ createdAt: { $gte: todayStart } }),
      OrderModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      getMonnifyWalletBalance(),
      MenuItemModel.distinct("vendorId"),
      PlatformWithdrawal.aggregate([
        { $group: { _id: null, total: { $sum: "$amountInKobo" } } },
      ]),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: "$balanceInKobo" } } },
      ]),
      VendorModel.aggregate([
        {
          $group: {
            _id: null,
            totalPending: { $sum: "$pendingWalletBalanceInKobo" },
            totalDisbursed: { $sum: "$walletTotalDisbursedInKobo" },
          },
        },
      ]),
    ])

    const vendorsWithoutMenus = await VendorModel.countDocuments({
      _id: { $nin: vendorIdsWithMenus },
      isActive: true,
    })

    // Build a status → count map
    const byStatus: Record<string, number> = {}
    for (const entry of statusCounts) {
      byStatus[entry._id] = entry.count
    }

    // Financials: sum totalAmountInKobo (GMV) and platformCommissionInKobo (Profit) for all PAID orders
    const revenueAgg = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          grossVolumeInKobo: { $sum: "$totalAmountInKobo" },
          platformProfitInKobo: { $sum: "$platformCommissionInKobo" },
        },
      },
    ])
    const grossVolumeInKobo = revenueAgg[0]?.grossVolumeInKobo ?? 0
    const platformProfitInKobo = revenueAgg[0]?.platformProfitInKobo ?? 0

    // Financial Health
    const allTimePlatformProfitInKobo = platformProfitInKobo
    const totalWithdrawnInKobo = withdrawalAgg[0]?.total ?? 0
    const remainingProfitInKobo =
      allTimePlatformProfitInKobo - totalWithdrawnInKobo
    const totalCustomerWalletLiabilities = walletLiabilitiesAgg[0]?.total ?? 0

    const totalPendingVendorWallet = vendorWalletAgg[0]?.totalPending ?? 0
    const totalVendorWalletDisbursed = vendorWalletAgg[0]?.totalDisbursed ?? 0

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
      vendorsWithoutMenus,
      grossVolumeInKobo,
      platformProfitInKobo,
      monnifyBalanceInKobo:
        monnifyBalance !== null ? nairaToKobo(monnifyBalance) : null,
      allTimePlatformProfitInKobo,
      totalWithdrawnInKobo,
      remainingProfitInKobo,
      totalCustomerWalletLiabilitiesInKobo: totalCustomerWalletLiabilities,
      totalPendingVendorWalletInKobo: totalPendingVendorWallet,
      totalVendorWalletDisbursedInKobo: totalVendorWalletDisbursed,
    })
  } catch (error) {
    console.error("[admin/stats]", error)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
