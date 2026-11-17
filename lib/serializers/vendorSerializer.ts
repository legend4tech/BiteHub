/**
 * vendorSerializer.ts
 *
 * Serializers for Vendor and MenuItem Mongoose .lean() documents.
 * Normalizes _id to id, evaluates availability virtuals, and ensures safe JSON formatting.
 */

import type { IVendor } from "@/models/Vendor"
import type { IMenuItem } from "@/models/MenuItem"
import { isItemAvailableNow } from "@/lib/timeUtils"
import { LeanDoc, safeDate } from "./base"

export type LeanVendor = LeanDoc<IVendor>
export type LeanMenuItem = LeanDoc<IMenuItem>

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
    receivesMarketing: doc.receivesMarketing ?? true,
    isOpen: doc.isOpen ?? true,
    defaultDeliveryFeeInKobo: doc.defaultDeliveryFeeInKobo ?? 0,
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
    pendingWalletBalanceInKobo: doc.pendingWalletBalanceInKobo ?? 0,
    walletTotalDisbursedInKobo: doc.walletTotalDisbursedInKobo ?? 0,
    lastBankUpdateAt: doc.lastBankUpdateAt
      ? safeDate(doc.lastBankUpdateAt)
      : null,
    rating: doc.rating ?? 0,
    ratingCount: doc.ratingCount ?? 0,
  }
}

export function serializePublicVendor(doc: LeanVendor | null) {
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
    receivesMarketing: doc.receivesMarketing ?? true,
    isOpen: doc.isOpen ?? true,
    defaultDeliveryFeeInKobo: doc.defaultDeliveryFeeInKobo ?? 0,
    prepTime: doc.prepTime ?? "",
    image: doc.image ?? null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
    // Virtuals
    initials,
    tagline: doc.description ?? "The best food on campus",
    location: doc.campus ?? "Main Campus",
    rating: doc.rating ?? 0,
    ratingCount: doc.ratingCount ?? 0,
  }
}

export function serializeMenuItem(doc: LeanMenuItem | null) {
  if (!doc) return null

  const resolvedAvailableDays = Array.isArray(doc.availableDays)
    ? doc.availableDays
    : Array.isArray(
          (doc.availableDays as unknown as { default?: string[] })?.default
        )
      ? (doc.availableDays as unknown as { default: string[] }).default
      : [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ]

  return {
    id: doc._id.toString(),
    vendorId: doc.vendorId.toString(),
    name: doc.name,
    description: doc.description ?? null,
    priceInKobo: doc.priceInKobo,
    category: doc.category,
    image: doc.image ?? null,
    isAvailable: doc.isAvailable,
    availableFrom: doc.availableFrom ?? null,
    availableTo: doc.availableTo ?? null,
    prepTimeValue: doc.prepTimeValue ?? null,
    prepTimeUnit: doc.prepTimeUnit ?? null,
    quantityAvailable: doc.quantityAvailable ?? null,
    availableDays: resolvedAvailableDays,
    isPreorder: doc.isPreorder ?? false,
    preorderEndDate: doc.preorderEndDate
      ? safeDate(doc.preorderEndDate)
      : undefined,
    preorderDeliveryInfo: doc.preorderDeliveryInfo ?? undefined,
    isAvailableNow: isItemAvailableNow(
      doc.isAvailable,
      doc.availableFrom,
      doc.availableTo,
      resolvedAvailableDays,
      doc.quantityAvailable,
      doc.isPreorder,
      doc.preorderEndDate
    ),
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
    rating: (doc as unknown as { rating?: number }).rating ?? 0,
    ratingCount: (doc as unknown as { ratingCount?: number }).ratingCount ?? 0,
  }
}
