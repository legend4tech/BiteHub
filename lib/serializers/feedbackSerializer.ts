/**
 * feedbackSerializer.ts
 *
 * Serializers for VendorFeedback, MenuItemFeedback, AdminUser, and PlatformFeedback documents.
 * Normalizes _id to id, protects passwords, and handles anonymous feedback flags.
 */

import type { Types } from "mongoose"
import { LeanDoc, safeDate } from "./base"

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
