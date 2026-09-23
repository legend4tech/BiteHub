/**
 * Centralised serializers for Mongoose .lean() documents.
 *
 * .lean() skips toJSON transforms, so _id stays an ObjectId, virtuals are absent,
 * and sensitive fields like password can leak. These serializers enforce strict,
 * explicit mapping so the frontend always receives clean JSON matching lib/types.ts.
 */

import type { Types } from "mongoose"
import type { IVendor } from "@/models/Vendor"
import type { IMenuItem } from "@/models/MenuItem"
import type { IOrder } from "@/models/Order"
import { isItemAvailableNow } from "@/lib/timeUtils"

/**
 * Represents a .lean() Mongoose document: _id is an ObjectId, timestamps are
 * Date objects, and Mongoose Document methods are absent.
 */
type LeanDoc<T> = Omit<T, keyof import("mongoose").Document> & {
  _id: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export type LeanVendor = LeanDoc<IVendor>
export type LeanMenuItem = LeanDoc<IMenuItem>
export type LeanOrder = LeanDoc<IOrder>
export type LeanCustomer = LeanDoc<import("@/models/Customer").ICustomer>
export type LeanWallet = LeanDoc<import("@/models/Wallet").IWallet>
export type LeanWalletTransaction = LeanDoc<
  import("@/models/WalletTransaction").IWalletTransaction
>
export type LeanPlatformWithdrawal = LeanDoc<
  import("@/models/PlatformWithdrawal").IPlatformWithdrawal
>
export type LeanVendorFeedback = LeanDoc<
  import("@/models/VendorFeedback").IVendorFeedback
>
export type LeanMenuItemFeedback = LeanDoc<
  import("@/models/MenuItemFeedback").IMenuItemFeedback
>
export type LeanAdminUser = LeanDoc<import("@/models/AdminUser").IAdminUser>
export type LeanPlatformFeedback = LeanDoc<
  import("@/models/PlatformFeedback").IPlatformFeedback
>

export type PopulatedVendorFeedback = LeanVendorFeedback & {
  vendorId: {
    _id: Types.ObjectId
    name: string
    image?: { url: string }
    slug: string
  } | null
}

// Safely parse dates which might come back as strings or be missing in raw DB docs
const safeDate = (val: unknown): string => {
  if (val instanceof Date) return val.toISOString()
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return new Date().toISOString()
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export function serializeVendor(doc: LeanVendor | null) {
  if (!doc) return null

  const name: string = doc.name
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return {
    id: doc._id.toString(),
    name,
    slug: doc.slug,
    description: doc.description ?? null,
    category: doc.category ?? null,
    tags: doc.tags ?? [],
    whatsappNumber: doc.whatsappNumber ?? null,
    school: doc.school ?? null,
    campus: doc.campus ?? null,
    isActive: doc.isActive,
    isOpen: doc.isOpen ?? true,
    deliveryFee: doc.deliveryFee ?? 0,
    prepTime: doc.prepTime ?? "",
    image: doc.image ?? null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
    // Virtuals
    initials,
    tagline: doc.description ?? "The best food on campus",
    location: doc.campus ?? "Main Campus",
    // Monnify integration fields
    monnifySubAccountCode: doc.monnifySubAccountCode ?? null,
    monnifyBankCode: doc.monnifyBankCode ?? null,
    monnifyAccountNumber: doc.monnifyAccountNumber ?? null,
    monnifyIntegrationStatus: doc.monnifyIntegrationStatus ?? "pending",
    pendingWalletBalance: doc.pendingWalletBalance ?? 0,
    walletTotalDisbursed: doc.walletTotalDisbursed ?? 0,
    lastBankUpdateAt: doc.lastBankUpdateAt
      ? safeDate(doc.lastBankUpdateAt)
      : null,
    rating: doc.rating ?? 0,
    ratingCount: doc.ratingCount ?? 0,
  }
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────

export function serializeMenuItem(doc: LeanMenuItem | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    vendorId: doc.vendorId.toString(),
    name: doc.name,
    description: doc.description ?? null,
    price: doc.price,
    category: doc.category,
    image: doc.image ?? null,
    isAvailable: doc.isAvailable,
    availableFrom: doc.availableFrom ?? null,
    availableTo: doc.availableTo ?? null,
    prepTimeValue: doc.prepTimeValue ?? null,
    prepTimeUnit: doc.prepTimeUnit ?? null,
    quantityAvailable: doc.quantityAvailable ?? null,
    availableDays: doc.availableDays ?? [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    isPreorder: doc.isPreorder ?? false,
    preorderEndDate: doc.preorderEndDate
      ? safeDate(doc.preorderEndDate)
      : undefined,
    preorderDeliveryInfo: doc.preorderDeliveryInfo ?? undefined,
    isAvailableNow: isItemAvailableNow(
      doc.isAvailable,
      doc.availableFrom,
      doc.availableTo,
      doc.availableDays,
      doc.quantityAvailable,
      doc.isPreorder,
      doc.preorderEndDate
    ),
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
    rating: (doc as unknown as { rating?: number }).rating ?? 0,
    ratingCount: (doc as unknown as { ratingCount?: number }).ratingCount ?? 0,
    // vendorName, vendorWhatsappNumber, tag — merged at route level
  }
}

// ─── Order ────────────────────────────────────────────────────────────────────

export function serializeOrder(doc: LeanOrder | null) {
  if (!doc) return null

  return {
    id: doc._id?.toString() || "",
    orderId: doc.orderId || "",
    vendorId:
      doc.vendorId && typeof doc.vendorId === "object" && "_id" in doc.vendorId
        ? String((doc.vendorId as unknown as { _id: unknown })._id)
        : String(doc.vendorId || ""),
    vendorName: doc.vendorName || "Unknown Vendor",
    vendorWhatsappNumber: doc.vendorWhatsappNumber || "",
    vendorPrepTime: doc.vendorPrepTime ?? "",
    customerName: doc.customerName || "Customer",
    customerPhone: doc.customerPhone || "",
    location: doc.location || "",
    items: Array.isArray(doc.items)
      ? doc.items.map((item) => ({
          menuItemId: item.menuItemId || "",
          name: item.name || "Item",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.image || undefined,
        }))
      : [],
    notes: doc.notes ?? "",
    deliveryFee: Number(doc.deliveryFee) || 0,
    serviceFee: Number(doc.serviceFee) || 0,
    platformCommission: Number(doc.platformCommission) || 0,
    vendorRevenue: Number(doc.vendorRevenue) || 0,
    totalAmount: Number(doc.totalAmount) || 0,
    status: doc.status || "pending",
    paymentMethod: doc.paymentMethod ?? "monnify",
    paymentStatus: doc.paymentStatus ?? "pending",
    monnifyReference: doc.monnifyReference ?? null,
    isRated: doc.isRated ?? false,
    isVendorRated: doc.isVendorRated ?? false,
    ratedItems: Array.isArray(doc.ratedItems) ? doc.ratedItems : [],
    expiresAt: doc.expiresAt ? safeDate(doc.expiresAt) : null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

// ─── Customer ─────────────────────────────────────────────────────────────────

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
    school: doc.school ?? null,
    campus: doc.campus ?? null,
    preferredLandmark: doc.preferredLandmark ?? null,
    preferredSubLandmark: doc.preferredSubLandmark ?? null,
    preferredExactLocation: doc.preferredExactLocation ?? null,
    lastLoginAt: doc.lastLoginAt ? safeDate(doc.lastLoginAt) : null,
    acceptedTermsVersion: doc.acceptedTermsVersion ?? null,
    acceptedTermsAt: doc.acceptedTermsAt ? safeDate(doc.acceptedTermsAt) : null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export function serializeWallet(doc: LeanWallet | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    customerId: doc.customerId.toString(),
    balance: doc.balance,
    monnifyReservedAccountRef: doc.monnifyReservedAccountRef ?? null,
    accountName: doc.accountName ?? null,
    accountNumber: doc.accountNumber ?? null,
    bankName: doc.bankName ?? null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

// ─── Wallet Transaction ───────────────────────────────────────────────────────

export function serializeWalletTransaction(doc: LeanWalletTransaction | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    customerId: doc.customerId.toString(),
    type: doc.type,
    amount: doc.amount,
    balanceAfter: doc.balanceAfter,
    direction: doc.direction,
    reference: doc.reference,
    description: doc.description,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

// ─── Platform Withdrawal ──────────────────────────────────────────────────────

export function serializePlatformWithdrawal(
  doc: LeanPlatformWithdrawal | null
) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    amount: doc.amount,
    reference: doc.reference,
    note: doc.note ?? null,
    withdrawnBy: doc.withdrawnBy,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

// ─── Delivery Zones ───────────────────────────────────────────────────────────

export type LeanLandmark = LeanDoc<import("@/models/Landmark").ILandmark>
export type LeanSubLandmark = LeanDoc<
  import("@/models/SubLandmark").ISubLandmark
>

export function serializeLandmark(doc: LeanLandmark | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    school: doc.school,
    campus: doc.campus,
    name: doc.name,
    defaultDeliveryFee: doc.defaultDeliveryFee,
    isActive: doc.isActive,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

export function serializeSubLandmark(doc: LeanSubLandmark | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    landmarkId: doc.landmarkId.toString(),
    name: doc.name,
    defaultDeliveryFee: doc.defaultDeliveryFee ?? null,
    isActive: doc.isActive,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export function serializeVendorFeedback(doc: LeanVendorFeedback | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    vendorId: doc.vendorId.toString(),
    customerId: doc.isAnonymous ? null : (doc.customerId?.toString() ?? ""),
    orderId: doc.orderId,
    rating: doc.rating,
    isAnonymous: doc.isAnonymous ?? false,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

export function serializeMenuItemFeedback(doc: LeanMenuItemFeedback | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    menuItemId: doc.menuItemId.toString(),
    orderId: doc.orderId,
    customerId: doc.isAnonymous ? null : doc.customerId.toString(),
    vendorId: doc.vendorId.toString(),
    rating: doc.rating,
    title: doc.title ?? "",
    comments: doc.comments ?? null,
    isAnonymous: doc.isAnonymous ?? false,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

// ─── Admin User ───────────────────────────────────────────────────────────────

/**
 * Never expose the hashed password to the client.
 * .lean() skips the toJSON transform that deletes it — so we must do it here.
 */
export function serializeAdminUser(doc: LeanAdminUser | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isActive: doc.isActive,
    lastLoginAt: doc.lastLoginAt ? safeDate(doc.lastLoginAt) : null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
    // password is intentionally omitted
  }
}

// ─── Platform Feedback ────────────────────────────────────────────────────────

export function serializePlatformFeedback(doc: LeanPlatformFeedback | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    rating: doc.rating,
    comments: doc.comments ?? null,
    orderId: doc.orderId ?? null,
    vendorId: doc.vendorId ? doc.vendorId.toString() : null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}
