import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import Vendor from "@/models/Vendor"
import { auth } from "@/auth"
import { ORDER_STATUS } from "@/lib/constants"

export const dynamic = "force-dynamic"

/**
 * GET /api/vendor/stats
 *
 * Computes all dashboard stats server-side using a single MongoDB aggregation.
 * This scales to millions of orders — MongoDB does the counting, not the browser.
 *
 * Returns:
 *  - totalOrders: all orders ever
 *  - todayOrders: orders created today (by createdAt)
 *  - pending: orders currently pending (any date)
 *  - inProgress: confirmed + preparing + ready (any date)
 *  - totalCompleted: all-time completed orders
 *  - totalRevenue: sum of totalAmount for all completed orders
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
    const vendorId = new Types.ObjectId(session.user.vendorId)

    // UTC boundaries for "today"
    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    // Check if the vendor has payment details set up
    const vendor = await Vendor.findById(vendorId)
      .select(
        "paymentDetails slug monnifySubAccountCode monnifyTotalDisbursed monnifyAccountNumber"
      )
      .lean()
    const hasPaymentDetails = !!(
      vendor?.monnifySubAccountCode ||
      (vendor?.paymentDetails?.bankName &&
        vendor?.paymentDetails?.accountNumber)
    )

    // Fetch the vendor user compliance records
    const { default: VendorUser } = await import("@/models/VendorUser")
    const email = session.user.email?.toLowerCase() || ""
    const vendorUser = await VendorUser.findOne({ email })
      .select("acceptedTermsVersion")
      .lean()
    const acceptedTermsVersion = vendorUser?.acceptedTermsVersion || ""

    // Single aggregation pipeline — MongoDB does all the work
    const [result] = await Order.aggregate([
      { $match: { vendorId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          // Today's orders by createdAt
          todayOrders: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$createdAt", todayStart] },
                    { $lt: ["$createdAt", todayEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          // Active orders needing vendor attention — newly paid (CONFIRMED)
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", ORDER_STATUS.CONFIRMED] }, 1, 0],
            },
          },
          inProgress: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [ORDER_STATUS.PREPARING, ORDER_STATUS.READY],
                  ],
                },
                1,
                0,
              ],
            },
          },
          // All-time totals
          totalCompleted: {
            $sum: {
              $cond: [{ $eq: ["$status", ORDER_STATUS.COMPLETED] }, 1, 0],
            },
          },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$paymentStatus", "paid"] },
                    { $ne: ["$status", "cancelled"] },
                  ],
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$vendorRevenue", null] },
                        { $gt: ["$vendorRevenue", 0] },
                      ],
                    },
                    "$vendorRevenue",
                    {
                      $subtract: [
                        { $ifNull: ["$totalAmount", 0] },
                        {
                          $add: [
                            { $ifNull: ["$serviceFee", 0] },
                            {
                              $ceil: {
                                $multiply: [
                                  { $ifNull: ["$totalAmount", 0] },
                                  0.05,
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ])

    // If the vendor has no orders yet, result will be undefined
    const finalStats = result ?? {
      totalOrders: 0,
      todayOrders: 0,
      pending: 0,
      inProgress: 0,
      totalCompleted: 0,
      totalRevenue: 0,
    }

    const monnifyDisbursed = vendor?.monnifyTotalDisbursed || 0
    const monnifyPending = Math.max(
      0,
      finalStats.totalRevenue - monnifyDisbursed
    )

    // Check if the vendor has Monnify connected
    const monnifySubAccountCode = vendor?.monnifySubAccountCode || null

    const response = NextResponse.json({
      ...finalStats,
      monnifyDisbursed,
      monnifyPending,
      monnifySubAccountCode,
      hasPaymentDetails,
      slug: vendor?.slug,
      acceptedTermsVersion,
    })

    response.headers.set(
      "Cache-Control",
      "no-store, max-age=0, must-revalidate"
    )

    return response
  } catch (error) {
    console.error("[vendor/stats GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
