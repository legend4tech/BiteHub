import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import mongoose from "mongoose"
import Order from "@/models/Order"
import MenuItem from "@/models/MenuItem"
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants"

export async function GET(request: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      const cronSecret = process.env.CRON_SECRET
      if (!cronSecret) {
        console.error(
          "[CRON release-quantity] Missing CRON_SECRET env variable"
        )
        return NextResponse.json(
          { error: "Server misconfiguration" },
          { status: 500 }
        )
      }

      const authHeader = request.headers.get("authorization")
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
    }

    await dbConnect()

    // Find orders that are pending and have expired
    const expiredOrders = await Order.find({
      status: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      expiresAt: { $lt: new Date() },
    })

    if (expiredOrders.length === 0) {
      return NextResponse.json({ status: "success", releasedCount: 0 })
    }

    let releasedItemCount = 0

    // Release the locked inventory for each expired order
    const session = await mongoose.startSession()

    for (const order of expiredOrders) {
      try {
        await session.withTransaction(async () => {
          const bulkOps = order.items.map(
            (item: { menuItemId: string; quantity: number }) => ({
              updateOne: {
                filter: {
                  _id: item.menuItemId,
                  quantityAvailable: { $ne: null },
                },
                update: { $inc: { quantityAvailable: item.quantity } },
              },
            })
          )

          if (bulkOps.length > 0) {
            await MenuItem.bulkWrite(bulkOps, { session })
            releasedItemCount += bulkOps.length
          }

          // Restore voucher if applied on this expired order
          if (order.rewardVoucherId) {
            const { default: RewardVoucher } =
              await import("@/models/RewardVoucher")
            const restoredVoucher = await RewardVoucher.findByIdAndUpdate(
              order.rewardVoucherId,
              {
                $set: { isUsed: false },
                $unset: { usedAt: 1 },
              },
              { new: true, session }
            )

            if (restoredVoucher && restoredVoucher.campaignId) {
              const { default: RewardCampaign } =
                await import("@/models/RewardCampaign")
              await RewardCampaign.findByIdAndUpdate(
                restoredVoucher.campaignId,
                {
                  $inc: {
                    budgetSpentInKobo: -(
                      order.sponsoredDiscountAmountInKobo || 0
                    ),
                  },
                },
                { session }
              )
            }
          }

          // Restore promo code if applied on this expired order
          if (order.promoCode && (order.promoDiscountInKobo || 0) > 0) {
            const { default: PromoCode } = await import("@/models/PromoCode")
            const { default: PromoCodeRedemption } =
              await import("@/models/PromoCodeRedemption")

            const promo = await PromoCode.findOneAndUpdate(
              { code: order.promoCode.trim().toUpperCase() },
              {
                $inc: {
                  budgetSpentInKobo: -order.promoDiscountInKobo,
                  currentRedemptions: -1,
                },
              },
              { session }
            )

            if (promo) {
              await PromoCodeRedemption.deleteOne(
                {
                  promoCodeId: promo._id,
                  orderId: order.orderId,
                },
                { session }
              )
            }
          }

          // Mark order as cancelled/expired so we don't process it again
          order.status = ORDER_STATUS.CANCELLED
          order.paymentStatus = "failed"
          order.notes =
            (order.notes ? order.notes + " | " : "") +
            "Cancelled due to checkout timeout."
          await order.save({ session, validateModifiedOnly: true })
        })
      } catch (err) {
        console.error(
          `[CRON release-quantity] Failed to process order ${order._id}:`,
          err
        )
      }
    }

    await session.endSession()

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
