/**
 * orderSerializer.ts
 *
 * Serializer for Order Mongoose .lean() documents.
 * Normalizes _id to id, maps items array, and formats timestamps.
 */

import type { IOrder } from "@/models/Order"
import { LeanDoc, safeDate } from "./base"

export type LeanOrder = LeanDoc<IOrder>

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
          priceInKobo: Number(item.priceInKobo) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.image || undefined,
        }))
      : [],
    notes: doc.notes ?? "",
    deliveryFeeInKobo: Number(doc.deliveryFeeInKobo) || 0,
    serviceFeeInKobo: Number(doc.serviceFeeInKobo) || 0,
    platformCommissionInKobo: Number(doc.platformCommissionInKobo) || 0,
    vendorRevenueInKobo: Number(doc.vendorRevenueInKobo) || 0,
    totalAmountInKobo: Number(doc.totalAmountInKobo) || 0,
    status: doc.status || "pending",
    paymentMethod: doc.paymentMethod ?? "monnify",
    paymentStatus: doc.paymentStatus ?? "pending",
    monnifyReference: doc.monnifyReference ?? null,
    isFullyRated: doc.isFullyRated ?? false,
    isVendorRated: doc.isVendorRated ?? false,
    ratedItems: Array.isArray(doc.ratedItems) ? doc.ratedItems : [],
    walletPromoAmountUsedInKobo: Number(doc.walletPromoAmountUsedInKobo) || 0,
    walletDepositAmountUsedInKobo:
      Number(doc.walletDepositAmountUsedInKobo) || 0,
    expiresAt: doc.expiresAt ? safeDate(doc.expiresAt) : null,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}
