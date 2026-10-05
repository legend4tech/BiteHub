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

export async function processWalletDisbursements() {
  await dbConnect()

  // Find and LOCK vendors that need to be paid
  // We use an update operation to atomically set isDisbursing to true for eligible vendors
  const lockedVendorsRaw = await Vendor.updateMany(
    {
      pendingWalletBalance: { $gt: 0 },
      monnifyAccountNumber: { $exists: true, $ne: "" },
      monnifyBankCode: { $exists: true, $ne: "" },
      isDisbursing: { $ne: true }, // Only pick those not already disbursing
    },
    { $set: { isDisbursing: true } }
  )

  if (lockedVendorsRaw.modifiedCount === 0) {
    return {
      message: "No pending wallet payouts or all currently processing",
      processed: 0,
    }
  }

  // Now fetch the vendors we just locked
  const vendorsToPay = await Vendor.find({
    isDisbursing: true,
    pendingWalletBalance: { $gt: 0 },
  })

  if (vendorsToPay.length === 0) {
    return { message: "No pending wallet payouts", processed: 0 }
  }

  const batchReference = `bulk-payout-${Date.now()}`
  const transactions = vendorsToPay.map((vendor) => ({
    amount: vendor.pendingWalletBalance,
    reference: `payout-${vendor._id}-${Date.now()}`,
    narration: `BiteHub Wallet Payout - ${vendor.name}`,
    bankCode: vendor.monnifyBankCode,
    accountNumber: vendor.monnifyAccountNumber,
  }))

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

    // If API call didn't throw, we assume success. Update local DB.
    for (const vendor of vendorsToPay) {
      const amountPaid = vendor.pendingWalletBalance

      await Vendor.findByIdAndUpdate(vendor._id, {
        $set: { isDisbursing: false },
        $inc: {
          walletTotalDisbursed: amountPaid,
          pendingWalletBalance: -amountPaid,
        },
      })

      // Mark the corresponding wallet orders as disbursed
      await Order.updateMany(
        {
          vendorId: vendor._id,
          paymentMethod: "wallet",
          paymentStatus: "paid",
          isDisbursed: { $ne: true },
        },
        { $set: { isDisbursed: true } }
      )

      totalDisbursedAmount += amountPaid
      processedCount++
    }

    return {
      message: "Wallet Disbursement successful",
      batchReference,
      processed: processedCount,
      totalAmount: totalDisbursedAmount,
      bulkResult,
    }
  } finally {
    // ALWAYS unlock any vendors that might have been locked but somehow not processed
    // (e.g. if the Monnify API failed, threw an error, or if we had 0 pending balance)
    await Vendor.updateMany(
      { isDisbursing: true },
      { $set: { isDisbursing: false } }
    )
  }
}
