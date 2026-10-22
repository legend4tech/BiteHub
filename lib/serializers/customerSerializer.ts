/**
 * customerSerializer.ts
 *
 * Serializers for Customer, Wallet, WalletTransaction, and PlatformWithdrawal documents.
 * Normalizes _id to id, protects sensitive customer information, and formats ISO dates.
 */

import { LeanDoc, safeDate } from "./base"

export type LeanCustomer = LeanDoc<import("@/models/Customer").ICustomer>
export type LeanWallet = LeanDoc<import("@/models/Wallet").IWallet>
export type LeanWalletTransaction = LeanDoc<
  import("@/models/WalletTransaction").IWalletTransaction
>
export type LeanPlatformWithdrawal = LeanDoc<
  import("@/models/PlatformWithdrawal").IPlatformWithdrawal
>

export function serializeCustomer(doc: LeanCustomer | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    name: doc.name,
    username: doc.username ?? null,
    email: doc.email,
    phone: doc.phone,
    referralCode: doc.referralCode,
    referredBy: doc.referredBy ?? null,
    isActive: doc.isActive,
    isEmailVerified: Boolean(doc.isEmailVerified),
    emailVerifiedAt: doc.emailVerifiedAt ? safeDate(doc.emailVerifiedAt) : null,
    receivesMarketing: doc.receivesMarketing ?? true,
    school: doc.school ?? null,
    campus: doc.campus ?? null,
    preferredLandmark: doc.preferredLandmark ?? null,
    preferredSubLandmark: doc.preferredSubLandmark ?? null,
    preferredExactLocation: doc.preferredExactLocation ?? null,
    lastLoginAt: doc.lastLoginAt ? safeDate(doc.lastLoginAt) : null,
    lastOrderAt: doc.lastOrderAt ? safeDate(doc.lastOrderAt) : null,
    sentReEngagementAt: doc.sentReEngagementAt
      ? safeDate(doc.sentReEngagementAt)
      : null,
    acceptedTermsVersion: doc.acceptedTermsVersion ?? null,
    acceptedTermsAt: doc.acceptedTermsAt ? safeDate(doc.acceptedTermsAt) : null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

export function serializeWallet(doc: LeanWallet | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    customerId: doc.customerId.toString(),
    balanceInKobo: doc.balanceInKobo,
    depositBalanceInKobo: doc.depositBalanceInKobo ?? 0,
    promoBalanceInKobo: doc.promoBalanceInKobo ?? 0,
    monnifyReservedAccountRef: doc.monnifyReservedAccountRef ?? null,
    accountName: doc.accountName ?? null,
    accountNumber: doc.accountNumber ?? null,
    bankName: doc.bankName ?? null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

export function serializeWalletTransaction(doc: LeanWalletTransaction | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    customerId: doc.customerId.toString(),
    type: doc.type,
    amountInKobo: doc.amountInKobo,
    balanceAfterInKobo: doc.balanceAfterInKobo,
    direction: doc.direction,
    reference: doc.reference,
    description: doc.description,
    expiresAt: doc.expiresAt ? safeDate(doc.expiresAt) : null,
    isExpired: doc.isExpired ?? false,
    remainingAmountInKobo: doc.remainingAmountInKobo,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

export function serializePlatformWithdrawal(
  doc: LeanPlatformWithdrawal | null
) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    amountInKobo: doc.amountInKobo,
    reference: doc.reference,
    note: doc.note ?? null,
    withdrawnBy: doc.withdrawnBy,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}
