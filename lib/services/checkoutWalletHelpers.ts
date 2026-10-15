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
  const WalletTransaction = (await import("@/models/WalletTransaction")).default

  // Lazy Expiry: Real-time clean up of expired coins prior to deduction
  const now = new Date()
  const expiredRewards = await WalletTransaction.find({
    customerId: customerForWallet._id,
    type: "reward",
    direction: "credit",
    isExpired: false,
    expiresAt: { $lt: now },
    $or: [
      { remainingAmountInKobo: { $gt: 0 } },
      { remainingAmountInKobo: { $exists: false } },
    ],
  }).session(mongooseSession)

  const lockedWallet = await Wallet.findOne({
    customerId: customerForWallet._id,
    balanceInKobo: { $gte: finalTotalInKobo },
  }).session(mongooseSession)

  if (!lockedWallet) {
    throw new Error("Insufficient balance")
  }

  if (expiredRewards.length > 0) {
    let expiredTotal = 0
    for (const reward of expiredRewards) {
      const rem =
        reward.remainingAmountInKobo !== undefined &&
        reward.remainingAmountInKobo !== null
          ? reward.remainingAmountInKobo
          : reward.amountInKobo || 0
      if (rem > 0) expiredTotal += rem
      reward.isExpired = true
      reward.remainingAmountInKobo = 0
      await reward.save({ session: mongooseSession })
    }

    if (expiredTotal > 0) {
      const deductFromPromo = Math.min(
        lockedWallet.promoBalanceInKobo || 0,
        expiredTotal
      )
      lockedWallet.promoBalanceInKobo -= deductFromPromo
      lockedWallet.balanceInKobo -= deductFromPromo
      await lockedWallet.save({ session: mongooseSession })

      // Re-verify that balance is sufficient after removing expired coins
      if (lockedWallet.balanceInKobo < finalTotalInKobo) {
        throw new Error("Insufficient balance")
      }
    }
  }

  const promoDeductionInKobo = useBHC
    ? Math.min(
        lockedWallet.promoBalanceInKobo || 0,
        Math.max(0, itemSubtotalInKobo)
      )
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

  // FIFO Deduction Logic
  if (promoDeductionInKobo > 0) {
    const activeRewards = await WalletTransaction.find({
      customerId: customerForWallet._id,
      type: "reward",
      direction: "credit",
      isExpired: false,
      $and: [
        {
          $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: { $exists: false } },
            { expiresAt: null },
          ],
        },
        {
          $or: [
            { remainingAmountInKobo: { $gt: 0 } },
            { remainingAmountInKobo: { $exists: false } },
          ],
        },
      ],
    })
      .sort({ expiresAt: 1 })
      .session(mongooseSession)

    let leftToDeduct = promoDeductionInKobo
    for (const reward of activeRewards) {
      if (leftToDeduct <= 0) break
      const currentRemaining =
        reward.remainingAmountInKobo !== undefined &&
        reward.remainingAmountInKobo !== null
          ? reward.remainingAmountInKobo
          : reward.amountInKobo || 0

      if (currentRemaining <= 0) continue

      const deduct = Math.min(currentRemaining, leftToDeduct)
      reward.remainingAmountInKobo = currentRemaining - deduct
      if (reward.remainingAmountInKobo === 0) {
        reward.isExpired = true // Fully used up
      }
      await reward.save({ session: mongooseSession })
      leftToDeduct -= deduct
    }

    if (leftToDeduct > 0) {
      console.warn(
        `[FIFO Deduction] Ledger drift: customer ${customerForWallet._id} promo balance exceeded active rewards by ${leftToDeduct} Kobo`
      )
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
