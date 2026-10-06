import mongoose from "mongoose"
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants"

export async function processWalletPaymentDeduction(
  customerForWallet: { _id: mongoose.Types.ObjectId | string },
  finalTotalInKobo: number,
  useBHC: boolean | undefined,
  orderId: string,
  vendorId: string,
  vendorRevenueInKobo: number,
  order: mongoose.Document & {
    walletPromoAmountUsedInKobo?: number
    walletDepositAmountUsedInKobo?: number
    status?: string
    paymentStatus?: string
  },
  mongooseSession: mongoose.ClientSession,
  itemSubtotalInKobo: number
) {
  const Wallet = (await import("@/models/Wallet")).default
  const lockedWallet = await Wallet.findOne({
    customerId: customerForWallet._id,
    balanceInKobo: { $gte: finalTotalInKobo },
  }).session(mongooseSession)

  if (!lockedWallet) {
    throw new Error("Insufficient balance")
  }

  const promoDeductionInKobo = useBHC
    ? Math.min(lockedWallet.promoBalanceInKobo || 0, itemSubtotalInKobo)
    : 0
  const depositDeductionInKobo = finalTotalInKobo - promoDeductionInKobo

  if ((lockedWallet.depositBalanceInKobo || 0) < depositDeductionInKobo) {
    throw new Error("Insufficient balance")
  }

  lockedWallet.promoBalanceInKobo -= promoDeductionInKobo
  lockedWallet.depositBalanceInKobo =
    (lockedWallet.depositBalanceInKobo || 0) - depositDeductionInKobo
  lockedWallet.balanceInKobo -= finalTotalInKobo

  await lockedWallet.save({ session: mongooseSession })
  const updatedWallet = lockedWallet

  const WalletTransaction = (await import("@/models/WalletTransaction")).default

  // FIFO Deduction Logic
  if (promoDeductionInKobo > 0) {
    const activeRewards = await WalletTransaction.find({
      customerId: customerForWallet._id,
      type: "reward",
      direction: "credit",
      isExpired: false,
      remainingAmountInKobo: { $gt: 0 },
    })
      .sort({ expiresAt: 1 })
      .session(mongooseSession)

    let leftToDeduct = promoDeductionInKobo
    for (const reward of activeRewards) {
      if (leftToDeduct <= 0) break
      const deduct = Math.min(reward.remainingAmountInKobo, leftToDeduct)
      reward.remainingAmountInKobo -= deduct
      if (reward.remainingAmountInKobo === 0) {
        reward.isExpired = true // Fully used up
      }
      await reward.save({ session: mongooseSession })
      leftToDeduct -= deduct
    }
  }

  await WalletTransaction.create(
    [
      {
        customerId: customerForWallet._id,
        type: "order_payment",
        amountInKobo: finalTotalInKobo,
        balanceAfterInKobo: updatedWallet.balanceInKobo,
        direction: "debit",
        reference: `ORD-${orderId}`,
        description: `Payment for order ${orderId}`,
      },
    ],
    { session: mongooseSession }
  )

  const Vendor = (await import("@/models/Vendor")).default
  await Vendor.findByIdAndUpdate(
    vendorId,
    {
      $inc: { pendingWalletBalanceInKobo: vendorRevenueInKobo },
    },
    { session: mongooseSession }
  )

  order.walletPromoAmountUsedInKobo = promoDeductionInKobo
  order.walletDepositAmountUsedInKobo = depositDeductionInKobo
  order.status = ORDER_STATUS.CONFIRMED
  order.paymentStatus = PAYMENT_STATUS.PAID
  await order.save({ session: mongooseSession })
}
