import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await dbConnect()

    const WalletTransaction = (await import("@/models/WalletTransaction"))
      .default
    const Order = (await import("@/models/Order")).default
    const RewardVoucher = (await import("@/models/RewardVoucher")).default

    // 1. Total BHC Issued All Time
    const allTimeIssuedResult = await WalletTransaction.aggregate([
      {
        $match: {
          type: "reward",
          direction: "credit",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ])
    const totalIssuedAllTime = allTimeIssuedResult[0]?.total || 0

    // 2. Total BHC Spent All Time
    const spentResult = await Order.aggregate([
      {
        $match: {
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$walletPromoAmountUsed" },
        },
      },
    ])
    const totalSpentAllTime = spentResult[0]?.total || 0

    // 4. Free Meals Redeemed (Vouchers Used)
    const vouchersUsedCount = await RewardVoucher.countDocuments({
      isUsed: true,
    })

    const redemptionRate =
      totalIssuedAllTime > 0
        ? Math.round((totalSpentAllTime / totalIssuedAllTime) * 100)
        : 0

    return NextResponse.json({
      success: true,
      data: {
        totalIssuedAllTime,
        totalSpentAllTime,
        redemptionRate,
        vouchersUsedCount,
      },
    })
  } catch (error) {
    console.error("Error fetching gamification analytics:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
