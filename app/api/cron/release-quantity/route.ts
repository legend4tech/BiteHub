import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import MenuItem from "@/models/MenuItem"
import { ORDER_STATUS } from "@/lib/constants"

export async function GET(request: Request) {
  try {
    // Only allow cron job to run this if in production (Vercel cron)
    const authHeader = request.headers.get("authorization")
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Find orders that are pending and have expired
    const expiredOrders = await Order.find({
      status: ORDER_STATUS.PENDING,
      paymentStatus: "pending",
      expiresAt: { $lt: new Date() },
    })

    if (expiredOrders.length === 0) {
      return NextResponse.json({ status: "success", releasedCount: 0 })
    }

    let releasedItemCount = 0

    // Release the locked inventory for each expired order
    for (const order of expiredOrders) {
      const bulkOps = order.items.map(
        (item: { menuItemId: string; quantity: number }) => ({
          updateOne: {
            filter: { _id: item.menuItemId, quantityAvailable: { $ne: null } },
            update: { $inc: { quantityAvailable: item.quantity } },
          },
        })
      )

      if (bulkOps.length > 0) {
        await MenuItem.bulkWrite(bulkOps)
        releasedItemCount += bulkOps.length
      }

      // Mark order as cancelled/expired so we don't process it again
      order.status = ORDER_STATUS.CANCELLED
      order.paymentStatus = "failed"
      order.notes =
        (order.notes ? order.notes + " | " : "") +
        "Cancelled due to checkout timeout."
      await order.save({ validateModifiedOnly: true })
    }

    return NextResponse.json({
      status: "success",
      releasedCount: releasedItemCount,
      expiredOrdersCount: expiredOrders.length,
    })
  } catch (error) {
    console.error("[CRON release-quantity]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
