import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import Vendor from "@/models/Vendor"
import { ORDER_STATUS } from "@/lib/constants"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Secure the cron endpoint. Vercel automatically sends this header.
    // Make sure you have CRON_SECRET configured in your Vercel Environment Variables.
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Calculate the most recent 10:30 PM
    const now = new Date()
    const cutoffTime = new Date(now)
    cutoffTime.setHours(22, 30, 0, 0) // 10:30 PM

    // If today's 10:30 PM is still in the future, we want yesterday's 10:30 PM
    if (cutoffTime > now) {
      cutoffTime.setDate(cutoffTime.getDate() - 1)
    }

    console.log(
      `[Cron Disbursement] Using cutoff time: ${cutoffTime.toLocaleString()}`
    )

    const query = {
      paymentStatus: "paid",
      paymentMethod: "monnify",
      status: ORDER_STATUS.COMPLETED,
      isDisbursed: { $ne: true },
      createdAt: { $lt: cutoffTime },
    }

    const ordersToDisburse = await Order.find(query)

    if (ordersToDisburse.length === 0) {
      console.log(
        "[Cron Disbursement] No pending orders to disburse before the cutoff time."
      )
      return NextResponse.json({ message: "No pending orders", processed: 0 })
    }

    let totalDisbursedAmount = 0
    let processedCount = 0

    for (const order of ordersToDisburse) {
      const amountToDisburse = order.vendorRevenue

      if (!amountToDisburse || amountToDisburse <= 0) {
        continue
      }

      const vendor = await Vendor.findById(order.vendorId)
      if (!vendor) {
        continue
      }

      const currentDisbursed = vendor.monnifyTotalDisbursed || 0
      vendor.monnifyTotalDisbursed = currentDisbursed + amountToDisburse

      order.isDisbursed = true

      await vendor.save()
      await order.save({ validateModifiedOnly: true })

      console.log(
        `[Cron Disbursement] ✅ Disbursed ₦${amountToDisburse} to Vendor: "${vendor.slug}" for Order: ${order.orderId}`
      )

      totalDisbursedAmount += amountToDisburse
      processedCount++
    }

    return NextResponse.json({
      message: "Disbursement successful",
      processed: processedCount,
      totalAmount: totalDisbursedAmount,
    })
  } catch (error) {
    console.error("[Cron Disbursement] Error during execution:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
