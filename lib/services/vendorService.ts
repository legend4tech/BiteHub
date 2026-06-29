/**
 * vendorService.ts
 *
 * Single source of truth for all vendor DB queries.
 * Used by BOTH /api/vendors route (client-side React Query)
 * AND server pages (app/vendors/page.tsx, landing FeaturedVendors).
 */

import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import MenuItem from "@/models/MenuItem"
import { serializeVendor, type LeanVendor } from "@/lib/serializers"
import type { VendorFilterItem } from "@/lib/types"
import type mongoose from "mongoose"

export interface GetVendorsOptions {
  q?: string
  school?: string
  campus?: string
  page?: number
  limit?: number
  freeDelivery?: boolean
  topRated?: boolean
  openNow?: boolean
}

export interface GetFeaturedVendorsOptions {
  school?: string
  campus?: string
  limit?: number
}

// ─── List vendors (paginated, filtered) ────────────────────────────────────────

export async function getVendors(options: GetVendorsOptions = {}) {
  const { q, school, campus, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  await dbConnect()

  const query: Record<string, unknown> = {
    isActive: true,
    monnifyIntegrationStatus: "active",
  }

  if (school) query.school = school
  if (campus) query.campus = campus
  if (options.freeDelivery) query.deliveryFee = 0
  if (options.topRated) query.rating = { $gte: 4.0 }
  if (options.openNow) query.isActive = true

  const finalQuery: Record<string, unknown> = { ...query }

  if (q) {
    finalQuery.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ]
  }

  const [vendors, totalVendors] = await Promise.all([
    VendorModel.find(finalQuery)
      .select(
        "name isActive slug description category tags phone whatsappNumber school campus image rating ratingCount createdAt updatedAt"
      )
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VendorModel.countDocuments(finalQuery),
  ])

  const vendorIds = vendors.map((v) => v._id as mongoose.Types.ObjectId)

  // Single aggregation to count available menu items per vendor
  const counts = await MenuItem.aggregate([
    { $match: { vendorId: { $in: vendorIds }, isAvailable: true } },
    { $group: { _id: "$vendorId", count: { $sum: 1 } } },
  ])

  const countMap = new Map<string, number>(
    counts.map((c) => [c._id.toString(), c.count])
  )

  const serializedVendors = vendors.map((vendor) => ({
    ...serializeVendor(vendor),
    itemCount: countMap.get(vendor._id.toString()) || 0,
  }))

  return { vendors: serializedVendors, totalVendors }
}

// ─── Featured vendors (landing page preview) ───────────────────────────────────

export async function getFeaturedVendors(
  options: GetFeaturedVendorsOptions = {}
) {
  const { school, campus, limit = 4 } = options

  await dbConnect()

  const query: Record<string, unknown> = {
    isActive: true,
    monnifyIntegrationStatus: "active",
  }
  if (school) query.school = school
  if (campus) query.campus = campus

  const vendorDocs = await VendorModel.find(query)
    .select(
      "name isActive slug description category tags phone whatsappNumber school campus image rating ratingCount createdAt updatedAt"
    )
    .sort({ isFeatured: -1, rating: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .lean()

  return vendorDocs.map((v) => serializeVendor(v as LeanVendor))
}

// ─── Vendor Profile (Dashboard) ────────────────────────────────────────────────

export async function getVendorProfile(
  vendorId: string | mongoose.Types.ObjectId
) {
  await dbConnect()
  const vendor = await VendorModel.findById(vendorId).lean()
  if (!vendor) return null
  return serializeVendor(vendor as LeanVendor)
}

// ─── Vendor Filter (lightweight — for /menus dropdown) ─────────────────────────
// VendorFilterItem is defined in lib/types.ts — imported above.

export interface GetVendorsForFilterOptions {
  school?: string
  campus?: string
  page?: number
  limit?: number
}

export async function getVendorsForFilter(
  options: GetVendorsForFilterOptions = {}
) {
  const { school, campus, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  await dbConnect()

  const query: Record<string, unknown> = {
    isActive: true,
    monnifyIntegrationStatus: "active",
  }
  if (school) query.school = school
  if (campus) query.campus = campus

  const [vendors, total] = await Promise.all([
    VendorModel.find(query)
      .select("_id name slug image isFeatured rating")
      .sort({ isFeatured: -1, rating: -1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean<
        Array<{
          _id: unknown
          name: string
          slug: string
          image?: { url: string; publicId: string }
        }>
      >(),
    VendorModel.countDocuments(query),
  ])

  const items: VendorFilterItem[] = vendors.map((v) => ({
    id: String(v._id),
    name: v.name,
    slug: v.slug,
    image: v.image,
  }))

  return { items, total, hasMore: skip + limit < total }
}
