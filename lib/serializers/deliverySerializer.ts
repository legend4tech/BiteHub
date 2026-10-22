/**
 * deliverySerializer.ts
 *
 * Serializers for Landmark and SubLandmark delivery zone documents.
 * Normalizes _id to id and converts timestamps to ISO strings.
 */

import { LeanDoc, safeDate } from "./base"

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
    defaultDeliveryFeeInKobo: doc.defaultDeliveryFeeInKobo,
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
    defaultDeliveryFeeInKobo: doc.defaultDeliveryFeeInKobo ?? null,
    isActive: doc.isActive,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}
