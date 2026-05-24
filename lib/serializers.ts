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
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    // vendorName, vendorWhatsappNumber, tag — merged at route level
  }
}

// ─── Order ────────────────────────────────────────────────────────────────────

export function serializeOrder(doc: LeanOrder | null) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    orderId: doc.orderId,
    vendorId: doc.vendorId.toString(),
    vendorName: doc.vendorName,
    vendorWhatsappNumber: doc.vendorWhatsappNumber,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone,
    location: doc.location,
    items: doc.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    notes: doc.notes ?? null,
    totalAmount: doc.totalAmount,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}
