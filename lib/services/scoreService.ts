/**
 * scoreService.ts
 *
 * Calculates and synchronizes discovery scores and ratings for vendors
 * and their menu items based on feedback.
 */
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import MenuItem from "@/models/MenuItem"
import { DISCOVERY_SCORE } from "@/lib/constants"
import type mongoose from "mongoose"

/**
 * Computes the static portion of the discovery score for a vendor.
 * This represents the overall "quality/popularity" of the vendor.
 */
export function calculateBaseDiscoveryScore(vendor: {
  isFeatured?: boolean
  rating?: number
  ratingCount?: number
}): number {
  const isFeatured = vendor.isFeatured ?? false
  const rating = vendor.rating ?? 0
  const ratingCount = vendor.ratingCount ?? 0

  const featuredBoost = isFeatured ? DISCOVERY_SCORE.FEATURED_BOOST : 0
  const ratingScore = rating * DISCOVERY_SCORE.RATING_MULTIPLIER
  const reviewCountScore =
    Math.log(ratingCount + 1) * DISCOVERY_SCORE.REVIEW_COUNT_MULTIPLIER

  return featuredBoost + ratingScore + reviewCountScore
}

/**
 * Recalculates the base discovery score for a vendor and updates all their menu items.
 * Call this whenever a vendor's rating, ratingCount, or isFeatured status changes.
 */
export async function syncVendorMenuScores(
  vendorId: string | mongoose.Types.ObjectId
) {
  await dbConnect()

  const vendor = await Vendor.findById(vendorId)
    .select("isFeatured rating ratingCount")
    .lean<{
      isFeatured?: boolean
      rating?: number
      ratingCount?: number
    }>()

  if (!vendor) return

  const newScore = calculateBaseDiscoveryScore(vendor)

  await MenuItem.updateMany(
    { vendorId },
    { $set: { baseDiscoveryScore: newScore } }
  )

  return newScore
}
