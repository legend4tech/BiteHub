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
      doc.quantityAvailable
    ),
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
    // vendorName, vendorWhatsappNumber, tag — merged at route level
  }
}

// ─── Order ────────────────────────────────────────────────────────────────────

export function serializeOrder(doc: LeanOrder | null) {
  if (!doc) return null

  return {
    id: doc._id?.toString() || "",
    orderId: doc.orderId || "",
    vendorId: doc.vendorId?.toString() || "",
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
    expiresAt: doc.expiresAt ? safeDate(doc.expiresAt) : null,
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
