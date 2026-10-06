import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { auth } from "@/auth"
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS,
  PAYMENT_STATUS,
  OrderStatusType,
} from "@/lib/constants"

import { statusUpdateSchema } from "@/lib/schemas"

/**
 * PATCH /api/vendor/orders/[id]
 * Updates the status of a specific order. Only the owning vendor can do this.
 */
export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
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
    const body = await request.json()

    const parsedBody = statusUpdateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid status", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const { status } = parsedBody.data

    const order = await Order.findOne({ orderId: params.id, vendorId })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (
      order.paymentStatus === PAYMENT_STATUS.PENDING &&
      status !== ORDER_STATUS.CANCELLED
    ) {
      return NextResponse.json(
        { error: "Cannot process an unpaid order. You may only cancel it." },
        { status: 400 }
      )
    }

    if (
      status === ORDER_STATUS.CANCELLED &&
      order.status === ORDER_STATUS.COMPLETED
    ) {
      return NextResponse.json(
        {
          error: "You cannot cancel an order that has already been completed.",
        },
        { status: 400 }
      )
    }

    // We must block cancellations during the brief window when a payout is actively communicating with Monnify.
    // If a cancellation slips through here, it would deduct from the vendor's pending balance while the cash is already in transit, resulting in a negative ledger balance.
    if (status === ORDER_STATUS.CANCELLED && order.paymentMethod === "wallet") {
      const { default: Vendor } = await import("@/models/Vendor")
      const vendor = await Vendor.findById(vendorId)
        .select("isDisbursing")
        .lean()
      if (vendor?.isDisbursing) {
        return NextResponse.json(
          {
            error:
              "A payout is currently in progress. To protect ledger integrity, you cannot cancel wallet orders at this exact moment. Please try again in a few minutes when the payout completes.",
          },
          { status: 409 }
        )
      }
    }

    // Atomic update to prevent Double Refund / Race Conditions
    const oldStatus = order.status
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: params.id, vendorId, status: { $ne: status } },
      { $set: { status } },
      { new: true, runValidators: true }
    )

    if (!updatedOrder) {
      // Order status was already updated by a concurrent request
      return NextResponse.json(
        { message: "Order status already updated" },
        { status: 200 }
      )
    }

    order.status = status // Update local object for the rest of the flow
    const wasCancelled = oldStatus === ORDER_STATUS.CANCELLED

    // Send customer email if email exists and status changed
    if (order.customerEmail && status !== oldStatus) {
      if (status === ORDER_STATUS.COMPLETED) {
        const { sendOrderCompletedEmail } = await import("@/lib/mail")
        // Gamification trigger
        const { processOrderCompleted } =
          await import("@/lib/services/gamificationService")
        if (order.customerId) {
          // Update lastOrderAt for dormant customer re-engagement
          const { default: Customer } = await import("@/models/Customer")
          await Customer.findByIdAndUpdate(order.customerId, {
            $set: { lastOrderAt: new Date() },
          }).catch(console.error)

          processOrderCompleted(
            order.orderId,
            order.customerId.toString(),
            order.totalAmountInKobo
          ).catch(async (err: Error) => {
            const { default: GamificationFailureLog } =
              await import("@/models/GamificationFailureLog")
            await GamificationFailureLog.create({
              orderId: order.orderId,
              customerId: order.customerId?.toString(),
              errorMessage: err.message,
              errorStack: err.stack,
              context: "processOrderCompleted",
            }).catch(console.error)
          })
        }

        // Fire and forget
        void sendOrderCompletedEmail(
          order.customerEmail,
          order.customerName,
          order.orderId,
          order.vendorName
        )
      } else {
        const { sendCustomerOrderStatusEmail } = await import("@/lib/mail")
        const statusConfig = ORDER_STATUS_CONFIG[status as OrderStatusType]
        if (statusConfig) {
          // Fire and forget
          void sendCustomerOrderStatusEmail(
            order.customerEmail,
            order.customerName,
            order.orderId,
            order.vendorName,
            statusConfig.label,
            statusConfig.description
          )
        }
      }
    }

    if (status === ORDER_STATUS.CANCELLED && !wasCancelled) {
      if (order.paymentMethod === "wallet" && !order.isDisbursed) {
        const { default: Customer } = await import("@/models/Customer")
        const customer = await Customer.findOne({ email: order.customerEmail })

        if (customer) {
          const { default: Wallet } = await import("@/models/Wallet")
          const { default: WalletTransaction } =
            await import("@/models/WalletTransaction")

          const promoRefund = order.walletPromoAmountUsedInKobo || 0
          const depositRefund =
            order.walletDepositAmountUsedInKobo ||
            order.totalAmountInKobo - promoRefund

          // Atomic Wallet Refund to prevent race conditions
          const updatedWallet = await Wallet.findOneAndUpdate(
            { customerId: customer._id },
            {
              $inc: {
                balanceInKobo: order.totalAmountInKobo,
                promoBalanceInKobo: promoRefund,
                depositBalanceInKobo: depositRefund,
              },
            },
            { new: true }
          )

          if (updatedWallet) {
            const txs = []
            if (depositRefund > 0) {
              txs.push({
                customerId: customer._id,
                type: "refund",
                amountInKobo: depositRefund,
                balanceAfterInKobo: updatedWallet.balanceInKobo - promoRefund, // Approximate intermediate balance
                direction: "credit",
                reference: `REF-DEP-${order.orderId}`,
                description: `Cash refund for cancelled order ${order.orderId}`,
              })
            }
            if (promoRefund > 0) {
              const expiresAt = new Date()
              expiresAt.setDate(expiresAt.getDate() + 30) // Standard 30 days validity for refunded coins
              txs.push({
                customerId: customer._id,
                type: "reward",
                amountInKobo: promoRefund,
                remainingAmountInKobo: promoRefund,
                expiresAt,
                isExpired: false,
                balanceAfterInKobo: updatedWallet.balanceInKobo,
                direction: "credit",
                reference: `REF-BHC-${order.orderId}`,
                description: `Coin refund for cancelled order ${order.orderId}`,
              })
            }

            if (txs.length > 0) {
              await WalletTransaction.insertMany(txs)
            }

            const { default: Vendor } = await import("@/models/Vendor")
            await Vendor.findByIdAndUpdate(order.vendorId, {
              $inc: { pendingWalletBalanceInKobo: -order.vendorRevenueInKobo },
            })

            if (order.rewardVoucherId) {
              const { default: RewardVoucher } =
                await import("@/models/RewardVoucher")
              const restoredVoucher = await RewardVoucher.findByIdAndUpdate(
                order.rewardVoucherId,
                {
                  $set: { isUsed: false },
                  $unset: { usedAt: 1 },
                },
                { new: true }
              )

              if (restoredVoucher && restoredVoucher.campaignId) {
                const { default: RewardCampaign } =
                  await import("@/models/RewardCampaign")
                await RewardCampaign.findByIdAndUpdate(
                  restoredVoucher.campaignId,
                  {
                    $inc: {
                      budgetSpentInKobo: -order.sponsoredDiscountAmountInKobo,
                    },
                  }
                )
              }
            }
          }
        }
      }

      const { default: AdminUser } = await import("@/models/AdminUser")
      const { sendAdminOrderCancelledEmail } = await import("@/lib/mail")

      const admins = await AdminUser.find({ isActive: true })
        .select("email")
        .lean()
      const adminEmails = admins.map((a: { email: string }) => a.email)

      if (adminEmails.length > 0) {
        // Fire and forget
        void sendAdminOrderCancelledEmail(
          adminEmails,
          order.orderId,
          order.vendorName,
          order.monnifyReference || ""
        )
      }
    }

    return NextResponse.json({ success: true, status: order.status })
  } catch (error) {
    console.error("[vendor/orders PATCH]", error)
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    )
  }
}
