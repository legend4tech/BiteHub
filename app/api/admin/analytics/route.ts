import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import OrderModel from "@/models/Order"
import CustomerModel from "@/models/Customer"
import { auth } from "@/auth"
import { analyticsQuerySchema } from "@/lib/schemas/admin"

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

import {
  AnalyticsPrevAgg,
  AnalyticsTimeSeriesItem,
  AnalyticsDowItem,
  AnalyticsTopVendorItem,
  AnalyticsTopZoneItem,
} from "@/types/admin"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const rawRange = searchParams.get("range")
    const rawFrom = searchParams.get("from")
    const rawTo = searchParams.get("to")

    const parsed = analyticsQuerySchema.safeParse({
      range: rawRange || undefined,
      from: rawFrom || undefined,
      to: rawTo || undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { range, from, to } = parsed.data

    // ── Date Range Calculation ──────────────────────────────────────────────
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date

    if (range === "custom" && from && to) {
      startDate = new Date(from)
      const endDate = new Date(to)
      endDate.setHours(23, 59, 59, 999)
      const duration = endDate.getTime() - startDate.getTime()
      previousEndDate = new Date(startDate.getTime())
      previousStartDate = new Date(startDate.getTime() - duration)
    } else if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(
        startDate.getTime() - 7 * 24 * 60 * 60 * 1000
      )
      previousEndDate = new Date(startDate)
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(
        startDate.getTime() - 30 * 24 * 60 * 60 * 1000
      )
      previousEndDate = new Date(startDate)
    } else if (range === "1y") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(
        startDate.getTime() - 365 * 24 * 60 * 60 * 1000
      )
      previousEndDate = new Date(startDate)
    } else {
      // all time
      startDate = new Date(0)
      previousStartDate = new Date(0)
      previousEndDate = new Date(0)
    }

    const dateFilter = { $gte: startDate }
    const isDaily = range === "7d" || range === "30d" || range === "custom"

    // ── 1. Current Period Paid Orders ───────────────────────────────────────
    // Using $facet to compute all paid-order KPIs, time-series, dow, and top vendors in one round-trip
    const paidAgg = await OrderModel.aggregate([
      { $match: { createdAt: dateFilter, paymentStatus: "paid" } },
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalGMV: { $sum: "$totalAmount" },
                totalProfit: { $sum: "$platformCommission" },
              },
            },
          ],
          timeSeries: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: isDaily ? "%Y-%m-%d" : "%Y-%m",
                    date: "$createdAt",
                  },
                },
                orders: { $sum: 1 },
                gmv: { $sum: { $ifNull: ["$totalAmount", 0] } },
                profit: { $sum: { $ifNull: ["$platformCommission", 0] } },
                firstDate: { $min: "$createdAt" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          dow: [
            {
              $group: {
                _id: { $dayOfWeek: "$createdAt" }, // 1 = Sun, 7 = Sat
                orders: { $sum: 1 },
                gmv: { $sum: { $ifNull: ["$totalAmount", 0] } },
              },
            },
          ],
          topVendors: [
            {
              $group: {
                _id: "$vendorId",
                vendorName: { $first: "$vendorName" },
                gmv: { $sum: { $ifNull: ["$totalAmount", 0] } },
                vendorRevenue: { $sum: { $ifNull: ["$vendorRevenue", 0] } },
                ordersCount: { $sum: 1 },
              },
            },
            { $sort: { gmv: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ])

    // ── 2. All Orders Analytics (Completion, Zones, Split) ──────────────────
    // Using $facet to compute status, payment methods, guest split, and zones in one round-trip
    const allAgg = await OrderModel.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                cancelled: {
                  $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
                },
                monnify: {
                  $sum: {
                    $cond: [{ $eq: ["$paymentMethod", "monnify"] }, 1, 0],
                  },
                },
                wallet: {
                  $sum: {
                    $cond: [{ $eq: ["$paymentMethod", "wallet"] }, 1, 0],
                  },
                },
                repeat: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: [{ $type: "$customerId" }, "missing"] },
                          { $ne: [{ $type: "$customerId" }, "null"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                guest: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $eq: [{ $type: "$customerId" }, "missing"] },
                          { $eq: [{ $type: "$customerId" }, "null"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          topZones: [
            {
              $group: {
                _id: "$location",
                orders: { $sum: 1 },
              },
            },
            { $sort: { orders: -1 } },
            { $limit: 7 },
          ],
        },
      },
    ])

    // ── 3. Previous Period KPIs (growth %) ─────────────────────────────────
    const hasPrevPeriod =
      previousEndDate.getTime() > previousStartDate.getTime()
    let prevAgg: AnalyticsPrevAgg[] = [{ kpis: [] }]
    if (hasPrevPeriod) {
      prevAgg = await OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: previousStartDate, $lt: previousEndDate },
            paymentStatus: "paid",
          },
        },
        {
          $facet: {
            kpis: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalGMV: { $sum: "$totalAmount" },
                  totalProfit: { $sum: "$platformCommission" },
                },
              },
            ],
          },
        },
      ])
    }

    // ── 4. Vendor & Customer Overview (Counts) ──────────────────────────────
    const [
      totalVendorsCount,
      activeVendorsCount,
      newVendorsCount,
      totalCustomersCount,
      newCustomersCount,
    ] = await Promise.all([
      VendorModel.countDocuments({}),
      VendorModel.countDocuments({ isActive: true }),
      VendorModel.countDocuments({ createdAt: dateFilter }),
      CustomerModel.countDocuments({}),
      CustomerModel.countDocuments({ createdAt: dateFilter }),
    ])

    // ── Format Output Data ──────────────────────────────────────────────────
    const paidResult = paidAgg[0] || {
      kpis: [],
      timeSeries: [],
      dow: [],
      topVendors: [],
    }
    const kpis = paidResult.kpis[0] || {
      totalOrders: 0,
      totalGMV: 0,
      totalProfit: 0,
    }

    const totalOrders = kpis.totalOrders
    const totalGMV = kpis.totalGMV
    const totalProfit = kpis.totalProfit
    const aov = totalOrders > 0 ? totalGMV / totalOrders : 0

    const allResult = allAgg[0] || { counts: [], topZones: [] }
    const allCounts = allResult.counts[0] || {
      total: 0,
      completed: 0,
      cancelled: 0,
      monnify: 0,
      wallet: 0,
      repeat: 0,
      guest: 0,
    }

    const completionRate =
      allCounts.total > 0
        ? Number(((allCounts.completed / allCounts.total) * 100).toFixed(1))
        : 0
    const cancellationRate =
      allCounts.total > 0
        ? Number(((allCounts.cancelled / allCounts.total) * 100).toFixed(1))
        : 0

    let growth = { orders: 0, gmv: 0, profit: 0, aov: 0 }
    if (hasPrevPeriod) {
      const prevResult = (prevAgg[0] &&
        prevAgg[0].kpis &&
        prevAgg[0].kpis[0]) || {
        totalOrders: 0,
        totalGMV: 0,
        totalProfit: 0,
      }
      const prevTotalOrders = prevResult.totalOrders
      const prevGMV = prevResult.totalGMV
      const prevProfit = prevResult.totalProfit
      const prevAOV = prevTotalOrders > 0 ? prevGMV / prevTotalOrders : 0

      const calcGrowth = (cur: number, prev: number) => {
        if (prev === 0) return cur > 0 ? 100 : 0
        return Number((((cur - prev) / prev) * 100).toFixed(1))
      }

      growth = {
        orders: calcGrowth(totalOrders, prevTotalOrders),
        gmv: calcGrowth(totalGMV, prevGMV),
        profit: calcGrowth(totalProfit, prevProfit),
        aov: calcGrowth(aov, prevAOV),
      }
    }

    const chartData = (paidResult.timeSeries || []).map(
      (item: AnalyticsTimeSeriesItem) => {
        const d = new Date(item.firstDate)
        return {
          date: isDaily
            ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : d.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              }),
          orders: item.orders,
          gmv: item.gmv,
          profit: item.profit,
        }
      }
    )

    const dowMap = new Map<
      number,
      { day: string; gmv: number; orders: number }
    >()
    DOW_LABELS.forEach((label, i) =>
      dowMap.set(i, { day: label, gmv: 0, orders: 0 })
    )
    ;(paidResult.dow || []).forEach((item: AnalyticsDowItem) => {
      // $dayOfWeek is 1-indexed starting Sunday
      const dow = item._id - 1
      if (dow >= 0 && dow <= 6) {
        const entry = dowMap.get(dow)!
        entry.gmv += item.gmv
        entry.orders += item.orders
      }
    })
    const revenueByDow = Array.from(dowMap.values())

    return NextResponse.json({
      kpis: {
        totalOrders,
        totalGMV,
        totalProfit,
        aov,
        completionRate,
        cancellationRate,
        growth,
      },
      chartData,
      revenueByDow,
      paymentSplit: { monnify: allCounts.monnify, wallet: allCounts.wallet },
      overview: {
        totalVendors: totalVendorsCount,
        activeVendors: activeVendorsCount,
        newVendors: newVendorsCount,
        totalCustomers: totalCustomersCount,
        newCustomers: newCustomersCount,
        repeatOrders: allCounts.repeat,
        guestOrders: allCounts.guest,
      },
      topVendors: (paidResult.topVendors || []).map(
        (v: AnalyticsTopVendorItem) => ({
          id: String(v._id),
          name: v.vendorName,
          gmv: v.gmv,
          vendorRevenue: v.vendorRevenue,
          ordersCount: v.ordersCount,
        })
      ),
      topZones: (allResult.topZones || []).map((z: AnalyticsTopZoneItem) => ({
        zone: z._id || "Unknown",
        orders: z.orders as number,
      })),
    })
  } catch (error) {
    console.error("[GET /api/admin/analytics]", error)
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    )
  }
}
