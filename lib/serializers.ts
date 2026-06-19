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

/**
 * Represents a .lean() Mongoose document: _id is an ObjectId, timestamps are
 * Date objects, and Mongoose Document methods are absent.
 */
type LeanDoc<T> = Omit<T, keyof import("mongoose").Document> & {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type LeanVendor = LeanDoc<IVendor>
export type LeanMenuItem = LeanDoc<IMenuItem>
export type LeanOrder = LeanDoc<IOrder>

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
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    // Virtuals
    initials,
    tagline: doc.description ?? "The best food on campus",
    location: doc.campus ?? "Main Campus",
    // Monnify integration fields
    monnifySubAccountCode: doc.monnifySubAccountCode ?? null,
    monnifyBankCode: doc.monnifyBankCode ?? null,
    monnifyIntegrationStatus: doc.monnifyIntegrationStatus ?? "pending",
    lastBankUpdateAt: doc.lastBankUpdateAt?.toISOString() ?? null,
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
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    // vendorName, vendorWhatsappNumber, tag — merged at route level
  }
}

// ─── Order ────────────────────────────────────────────────────────────────────

export function serializeOrder(doc: LeanOrder | null) {
  if (!doc) return null

  // Safely parse dates which might come back as strings or be missing in raw DB docs
  const safeDate = (val: unknown): string => {
    if (val instanceof Date) return val.toISOString()
    if (typeof val === "string" || typeof val === "number") {
      const d = new Date(val)
      if (!isNaN(d.getTime())) return d.toISOString()
    }
    return new Date().toISOString()
  }

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
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
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
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}
