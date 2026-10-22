/**
 * base.ts
 *
 * Core typing utilities and timestamp normalizers shared across all Mongoose serializers.
 */

import type { Types } from "mongoose"

/**
 * Represents a .lean() Mongoose document: _id is an ObjectId, timestamps are
 * Date objects, and Mongoose Document methods are absent.
 */
export type LeanDoc<T> = Omit<T, keyof import("mongoose").Document> & {
  _id: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Safely parse dates which might come back as Date objects, ISO strings,
 * epoch numbers, or be missing in raw DB docs.
 */
export const safeDate = (val: unknown): string => {
  if (val instanceof Date) return val.toISOString()
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return new Date().toISOString()
}
