/**
 * customerWalletService.ts
 *
 * Dedicated service for querying customer wallet data and transaction histories.
 * Extracts wallet operations from customerService to preserve single-responsibility
 * and uphold the CONTRIBUTING.md file size limit (< 450 lines).
 */

import dbConnect from "@/lib/db"
import { serializeWallet, serializeWalletTransaction } from "@/lib/serializers"
import type { Types } from "mongoose"
import type { Transaction } from "@/types/customer"

/**
 * Fetches the customer's wallet along with recent transactions and expiring promotional rewards.
 */
export async function getCustomerWalletData(
  customerId: string | Types.ObjectId
) {
  await dbConnect()
  const Wallet = (await import("@/models/Wallet")).default
  const WalletTransaction = (await import("@/models/WalletTransaction")).default

  const wallet = await Wallet.findOne({ customerId }).lean()
  let transactions: Transaction[] = []
  let expiringRewards: Transaction[] = []

  if (wallet) {
    const rawTransactions = await WalletTransaction.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    transactions = rawTransactions
      .map(serializeWalletTransaction)
      .filter(Boolean) as Transaction[]

    const now = new Date()
    const rawExpiringRewards = await WalletTransaction.find({
      customerId,
      type: "reward",
      direction: "credit",
      isExpired: false,
      expiresAt: { $gt: now },
      $or: [
        { remainingAmountInKobo: { $gt: 0 } },
        { remainingAmountInKobo: { $exists: false } },
      ],
    })
      .sort({ expiresAt: 1 })
      .lean()

    expiringRewards = rawExpiringRewards
      .map(serializeWalletTransaction)
      .filter(Boolean) as Transaction[]
  }

  return { wallet: serializeWallet(wallet), transactions, expiringRewards }
}

/**
 * Retrieves a paginated list of wallet transactions with optional direction/reward filters.
 */
export async function getCustomerTransactionsList(
  customerId: string | Types.ObjectId,
  page: number = 1,
  limit: number = 10,
  filter: string = "all"
) {
  await dbConnect()
  const WalletTransaction = (await import("@/models/WalletTransaction")).default

  const query: Record<string, unknown> = { customerId }

  if (filter === "credit") {
    query.direction = "credit"
  } else if (filter === "debit") {
    query.direction = "debit"
  } else if (filter === "rewards") {
    query.type = "reward"
  }

  const skip = (page - 1) * limit

  const [rawTransactions, totalTransactions] = await Promise.all([
    WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WalletTransaction.countDocuments(query),
  ])

  const transactions = rawTransactions
    .map(serializeWalletTransaction)
    .filter(Boolean) as Transaction[]

  return {
    transactions,
    page,
    totalPages: Math.ceil(totalTransactions / limit),
    totalTransactions,
    hasMore: skip + transactions.length < totalTransactions,
  }
}
