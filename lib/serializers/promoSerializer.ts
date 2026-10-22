/**
 * promoSerializer.ts
 *
 * Serializers for Mongoose PromoCode and PromoCodeRedemption .lean() documents.
 * Ensures consistent _id -> id mapping, ISO string dates, and strict type adherence.
 */

import type { Types } from "mongoose"
import type { IPromoCode } from "@/models/PromoCode"
import type { IPromoCodeRedemption } from "@/models/PromoCodeRedemption"
import type {
  PromoCode,
  PromoCodeRedemption,
  PromoRedemptionDetail,
} from "@/types/promo"

type LeanDoc<T> = Omit<T, keyof import("mongoose").Document> & {
  _id: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export type LeanPromoCode = LeanDoc<IPromoCode>
export type LeanPromoCodeRedemption = LeanDoc<IPromoCodeRedemption>

const safeDate = (val: unknown): string => {
  if (val instanceof Date) return val.toISOString()
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return new Date().toISOString()
}

export function serializePromoCode(
  doc: LeanPromoCode | null
): PromoCode | null {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    code: doc.code,
    title: doc.title,
    description: doc.description ?? null,
    targetSchool: doc.targetSchool ?? null,
    targetCampus: doc.targetCampus ?? null,
    targetVendorId: doc.targetVendorId ? doc.targetVendorId.toString() : null,
    targetMenuItemId: doc.targetMenuItemId ?? null,
    discountType: doc.discountType,
    discountValueInKobo: doc.discountValueInKobo,
    discountPercentage: doc.discountPercentage ?? null,
    maxDiscountInKobo: doc.maxDiscountInKobo ?? null,
    minOrderValueInKobo: doc.minOrderValueInKobo ?? null,
    budgetAllocatedInKobo: doc.budgetAllocatedInKobo,
    budgetSpentInKobo: doc.budgetSpentInKobo ?? 0,
    maxRedemptions: doc.maxRedemptions ?? null,
    currentRedemptions: doc.currentRedemptions ?? 0,
    maxRedemptionsPerCustomer: doc.maxRedemptionsPerCustomer ?? 1,
    isActive: doc.isActive,
    startDate: safeDate(doc.startDate),
    endDate: doc.endDate ? safeDate(doc.endDate) : null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

export function serializePromoCodeRedemption(
  doc: LeanPromoCodeRedemption | null
): PromoCodeRedemption | null {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    promoCodeId: doc.promoCodeId ? doc.promoCodeId.toString() : "",
    code: doc.code,
    customerId: doc.customerId ? doc.customerId.toString() : "",
    orderId: doc.orderId,
    discountAmountInKobo: doc.discountAmountInKobo,
    redeemedAt: safeDate(doc.redeemedAt),
  }
}

export interface RawPromoRedemptionDetail {
  _id: unknown
  code: string
  promoCodeId: unknown
  customerId: { name?: string; email?: string; phone?: string } | null
  orderId: string
  discountAmountInKobo: number
  redeemedAt: Date | string
  order?: {
    vendorName?: string
    items?: Array<{
      menuItemId?: string
      name: string
      quantity: number
      priceInKobo: number
    }>
    totalAmountInKobo?: number
    status?: string
  } | null
}

export function serializePromoRedemptionDetail(
  doc: RawPromoRedemptionDetail
): PromoRedemptionDetail {
  return {
    id: String(doc._id),
    code: doc.code,
    promoCodeId: String(doc.promoCodeId),
    customerName: doc.customerId?.name || "Guest Customer",
    customerEmail: doc.customerId?.email || "N/A",
    customerPhone: doc.customerId?.phone || "N/A",
    orderId: doc.orderId,
    vendorName: doc.order?.vendorName || "Unknown Vendor",
    items: doc.order?.items || [],
    totalAmountInKobo: doc.order?.totalAmountInKobo || 0,
    orderStatus: doc.order?.status || "confirmed",
    discountAmountInKobo: doc.discountAmountInKobo,
    redeemedAt: safeDate(doc.redeemedAt),
  }
}
