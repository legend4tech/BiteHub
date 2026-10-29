import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import AdminUser from "@/models/AdminUser"
import VendorUserModel from "@/models/VendorUser"
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants"
import {
  sendAdminOrderAttentionEmail,
  sendVendorOrderReminderEmail,
} from "@/lib/orderMail"

export const dynamic = "force-dynamic"

async function handleOrderAttention(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error("[CRON order-attention] Missing CRON_SECRET env variable")
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      )
    }

    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization")
    const expectedHeader = `Bearer ${cronSecret}`
    if (
      !authHeader ||
      authHeader.length !== expectedHeader.length ||
      !crypto.timingSafeEqual(
        Buffer.from(authHeader),
        Buffer.from(expectedHeader)
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Query active administrators and vendor managers
    const opsUsers = await AdminUser.find({
      role: { $in: ["admin", "superadmin", "vendor_manager"] },
      isActive: true,
    })
      .select("email name role")
      .lean()

    const opsEmails = opsUsers
      .map((u: { email?: string }) => u.email)
      .filter((e): e is string => Boolean(e))

    // Query active paid orders awaiting completion
    const activePaidOrders = await Order.find({
      paymentStatus: PAYMENT_STATUS.PAID,
      status: {
        $in: [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.CONFIRMED,
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.READY,
        ],
      },
      $or: [
        { attentionAlertLevel: { $lt: 3 } },
        { attentionAlertLevel: { $exists: false } },
      ],
    }).lean()

    if (activePaidOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No delayed paid orders requiring attention",
        activeOrdersCount: 0,
        alertsSent: 0,
      })
    }

    const now = new Date()
    let tier1Sent = 0
    let tier2Sent = 0
    let tier3Sent = 0

    // Cache vendor user emails to avoid duplicate queries
    const vendorEmailMap = new Map<string, string>()

    for (const order of activePaidOrders) {
      // Pre-orders follow scheduled delivery dates/times, not instant 10m rush
      const prepStr = (order.vendorPrepTime || "").toLowerCase().trim()
      if (
        (order as { isPreorder?: boolean }).isPreorder === true ||
        prepStr.includes("pre-order") ||
        prepStr.startsWith("delivery:")
      ) {
        continue
      }

      const orderCreatedAt = new Date(order.createdAt)
      const elapsedMinutes = Math.floor(
        (now.getTime() - orderCreatedAt.getTime()) / (60 * 1000)
      )

      const currentAlertLevel = (order.attentionAlertLevel as number) || 0
      let eligibleTier: 1 | 2 | 3 | null = null

      if (elapsedMinutes >= 60 && currentAlertLevel < 3) {
        eligibleTier = 3
      } else if (elapsedMinutes >= 20 && currentAlertLevel < 2) {
        eligibleTier = 2
      } else if (elapsedMinutes >= 10 && currentAlertLevel < 1) {
        eligibleTier = 1
      }

      if (!eligibleTier) {
        continue
      }

      // Fetch vendor user email
      const vendorIdStr = String(order.vendorId)
      let vendorEmail = vendorEmailMap.get(vendorIdStr)
      if (!vendorEmail) {
        const vendorUser = await VendorUserModel.findOne({
          vendorId: order.vendorId,
          isActive: true,
        })
          .select("email")
          .lean()
        const foundEmail = vendorUser?.email
        if (typeof foundEmail === "string") {
          vendorEmail = foundEmail
          vendorEmailMap.set(vendorIdStr, foundEmail)
        }
      }

      const formattedItems = (order.items || []).map(
        (item: { name: string; quantity: number; priceInKobo: number }) => ({
          name: item.name,
          quantity: item.quantity,
          priceInKobo: item.priceInKobo,
        })
      )

      // 1. Atomically claim and update order alert level to prevent duplicate alerts from overlapping cron runs
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          $or: [
            { attentionAlertLevel: { $lt: eligibleTier } },
            { attentionAlertLevel: { $exists: false } },
          ],
        },
        {
          $set: {
            attentionAlertLevel: eligibleTier,
            lastAttentionAlertAt: now,
          },
        },
        { new: true }
      )

      if (!updatedOrder) {
        // Already processed or updated by a concurrent worker
        continue
      }

      // 2. Dispatch Operations Alert to all active Admins & Vendor Managers
      if (opsEmails.length > 0) {
        const opsRes = await sendAdminOrderAttentionEmail({
          recipients: opsEmails,
          orderId: order.orderId,
          tier: eligibleTier,
          elapsedMinutes,
          currentStatus: order.status,
          vendorName: order.vendorName,
          vendorWhatsappNumber: order.vendorWhatsappNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryLocation: order.location,
          items: formattedItems,
          totalAmountInKobo: order.totalAmountInKobo,
        })
        if (!opsRes.success) {
          console.warn(
            `[CRON order-attention] Ops alert warning for ${order.orderId}:`,
            opsRes.error
          )
        }
      }

      // 3. Dispatch Delivery / Kitchen Reminder to the Vendor
      if (vendorEmail) {
        const vendorRes = await sendVendorOrderReminderEmail({
          vendorEmail,
          orderId: order.orderId,
          tier: eligibleTier,
          elapsedMinutes,
          currentStatus: order.status,
          vendorName: order.vendorName,
          customerName: order.customerName,
          deliveryLocation: order.location,
          items: formattedItems,
          vendorRevenueInKobo: order.vendorRevenueInKobo || 0,
        })
        if (!vendorRes.success) {
          console.warn(
            `[CRON order-attention] Vendor reminder warning for ${order.orderId}:`,
            vendorRes.error
          )
        }
      }

      if (eligibleTier === 1) tier1Sent++
      if (eligibleTier === 2) tier2Sent++
      if (eligibleTier === 3) tier3Sent++
    }

    return NextResponse.json({
      success: true,
      activeOrdersCount: activePaidOrders.length,
      alertsSent: tier1Sent + tier2Sent + tier3Sent,
      breakdown: {
        tier1_10m: tier1Sent,
        tier2_20m: tier2Sent,
        tier3_60m: tier3Sent,
      },
    })
  } catch (error) {
    console.error("[CRON order-attention]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return handleOrderAttention(request)
}

export async function POST(request: Request) {
  return handleOrderAttention(request)
}
