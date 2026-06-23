import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import MenuItem from "@/models/MenuItem"
import { sendCustomerOrderCancelledEmail } from "@/lib/mail"
import { ORDER_STATUS } from "@/lib/constants"

export const dynamic = "force-dynamic"

/**
 * GET /api/cron/cancel-unpaid-orders
 *
 * End-of-day sweep — runs at 22:55 UTC (11:55 PM WAT) via Vercel Cron.
 *
 * Finds every order that is still `status: "pending"` + `paymentStatus: "pending"`
 * and auto-cancels them, releasing reserved inventory in the process.
 *
 * This is an idempotent second-pass sweep that catches any orders missed by the
 * 15-minute `release-quantity` cron (e.g. orders with null expiresAt or edge cases).
 *
 * Only unpaid orders are touched — paid orders (paymentStatus: "paid") are never
 * matched by this query.
 */
export async function GET(request: Request) {
  try {
    // Secure the cron endpoint — Vercel sends this header automatically.
    // Ensure CRON_SECRET is set in your Vercel Environment Variables.
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Find all orders that are still awaiting payment — no date filter, this is
    // a full sweep. Paid orders (paymentStatus: "paid") are never matched here.
    const unpaidOrders = await Order.find({
      status: ORDER_STATUS.PENDING,
      paymentStatus: "pending",
    })

    if (unpaidOrders.length === 0) {
      console.log("[Cron cancel-unpaid-orders] No stale unpaid orders found.")
      return NextResponse.json({ message: "No unpaid orders", cancelled: 0 })
    }

    console.log(
      `[Cron cancel-unpaid-orders] Found ${unpaidOrders.length} unpaid order(s) to cancel.`
    )

    let cancelledCount = 0

    for (const order of unpaidOrders) {
      // 1. Release any reserved inventory quantities
      const bulkOps = order.items.map(
        (item: { menuItemId: string; quantity: number }) => ({
          updateOne: {
            filter: { _id: item.menuItemId, quantityAvailable: { $ne: null } },
            update: { $inc: { quantityAvailable: item.quantity } },
          },
        })
      )

      if (bulkOps.length > 0) {
        await MenuItem.bulkWrite(bulkOps).catch((err) => {
          console.error(
            `[Cron cancel-unpaid-orders] Failed to release inventory for order ${order.orderId}:`,
            err
          )
        })
      }

      // 2. Mark the order as cancelled
      order.status = ORDER_STATUS.CANCELLED
      order.paymentStatus = "failed"
      order.notes =
        (order.notes ? order.notes + " | " : "") +
        "Auto-cancelled: payment not received by end of day."

      await order.save()

      console.log(
        `[Cron cancel-unpaid-orders] ✅ Cancelled order: ${order.orderId}`
      )
      cancelledCount++

      // 3. Notify the customer asynchronously — only if we have their email
      if (order.customerEmail) {
        sendCustomerOrderCancelledEmail(
          order.customerEmail,
          order.customerName,
          order.orderId,
          order.vendorName
        ).catch((err) => {
          console.error(
            `[Cron cancel-unpaid-orders] Failed to send cancellation email for order ${order.orderId}:`,
            err
          )
        })
      }
    }

    return NextResponse.json({
      message: "End-of-day sweep complete",
      cancelled: cancelledCount,
    })
  } catch (error) {
    console.error("[Cron cancel-unpaid-orders] Error during execution:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
