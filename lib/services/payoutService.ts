/**
 * payoutService.ts
 *
 * Single source of truth for wallet payouts and disbursements.
 * Used by /api/cron/disburse-funds.
 */

import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import Vendor from "@/models/Vendor"
import { executeBulkDisbursement } from "@/lib/monnify"
import { toMajorUnit } from "@/lib/money"

export async function processWalletDisbursements() {
  await dbConnect()

  const batchReference = `bulk-payout-${Date.now()}`

  // Find and LOCK vendors that need to be paid for THIS batch
  // We use an update operation to atomically set isDisbursing and disbursementBatchId
  const lockedVendorsRaw = await Vendor.updateMany(
    {
      pendingWalletBalanceInKobo: { $gt: 0 },
      monnifyAccountNumber: { $exists: true, $ne: "" },
      monnifyBankCode: { $exists: true, $ne: "" },
      isDisbursing: { $ne: true }, // Only pick those not already disbursing
    },
    { $set: { isDisbursing: true, disbursementBatchId: batchReference } }
  )

  if (lockedVendorsRaw.modifiedCount === 0) {
    return {
      message: "No pending wallet payouts or all currently processing",
      processed: 0,
    }
  }

  // Now fetch only the vendors locked under this specific batch
  const vendorsToPay = await Vendor.find({
    disbursementBatchId: batchReference,
    pendingWalletBalanceInKobo: { $gt: 0 },
  })

  if (vendorsToPay.length === 0) {
    return { message: "No pending wallet payouts", processed: 0 }
  }
  const vendorTxMap = new Map<string, string>()
  const transactions = vendorsToPay.map((vendor) => {
    const reference = `payout-${vendor._id}-${Date.now()}`
    vendorTxMap.set(String(vendor._id), reference)
    return {
      amount: toMajorUnit(vendor.pendingWalletBalanceInKobo),
      reference,
      narration: `BiteHub Wallet Payout - ${vendor.name}`,
      destinationBankCode: vendor.monnifyBankCode,
      destinationAccountNumber: vendor.monnifyAccountNumber,
      destinationAccountName: vendor.name,
      currency: "NGN",
    }
  })

  let bulkResult
  try {
    // Execute Bulk Disbursement via Monnify
    bulkResult = await executeBulkDisbursement({
      batchReference,
      title: "BiteHub Daily Wallet Payouts",
      narration: "Automated wallet payouts to vendors",
      transactions,
    })

    let totalDisbursedAmount = 0
    let processedCount = 0

    const { ORDER_STATUS } = await import("@/lib/constants")

    // If API call didn't throw, we assume success. Update local DB.
    for (const vendor of vendorsToPay) {
      const amountPaidInKobo = vendor.pendingWalletBalanceInKobo
      const vendorTxRef = vendorTxMap.get(String(vendor._id))

      await Vendor.findByIdAndUpdate(vendor._id, {
        $set: { isDisbursing: false, disbursementBatchId: null },
        $inc: {
          walletTotalDisbursedInKobo: amountPaidInKobo,
          pendingWalletBalanceInKobo: -amountPaidInKobo,
        },
      })

      // Mark the exact wallet orders that contributed to this specific payout amount
      // This prevents race conditions where a new order is paid during the API call
      const pendingOrders = await Order.find({
        vendorId: vendor._id,
        paymentMethod: "wallet",
        paymentStatus: "paid",
        status: { $ne: ORDER_STATUS.CANCELLED },
        isDisbursed: { $ne: true },
      })
        .sort({ createdAt: 1 })
        .select("_id vendorRevenueInKobo")
        .lean()

      let runningTotal = 0
      const orderIdsToMark = []

      for (const po of pendingOrders) {
        // If adding this order exceeds the amount we actually paid out, stop.
        // It belongs to the next payout batch.
        if (runningTotal + po.vendorRevenueInKobo > amountPaidInKobo) {
          break
        }
        runningTotal += po.vendorRevenueInKobo
        orderIdsToMark.push(po._id)
      }

      if (orderIdsToMark.length > 0) {
        await Order.updateMany(
          { _id: { $in: orderIdsToMark } },
          { $set: { isDisbursed: true, payoutReference: vendorTxRef } }
        )
      }

      totalDisbursedAmount += amountPaidInKobo
      processedCount++
    }

    return {
      message: "Wallet Disbursement successful",
      batchReference,
      processed: processedCount,
      totalAmountInKobo: totalDisbursedAmount,
      bulkResult,
    }
  } finally {
    // ALWAYS unlock any vendors belonging to this batch that were not processed
    // (e.g. if the Monnify API failed, threw an error, or if we had 0 pending balance)
    await Vendor.updateMany(
      { disbursementBatchId: batchReference },
      { $set: { isDisbursing: false, disbursementBatchId: null } }
    )
  }
}
