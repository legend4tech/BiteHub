/**
 * vendorService.ts
 *
 * Single source of truth for all vendor DB queries.
 * Used by BOTH /api/vendors route (client-side React Query)
 * AND server pages (app/vendors/page.tsx, landing FeaturedVendors).
 */

import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import VendorFeedback from "@/models/VendorFeedback"
import MenuItem from "@/models/MenuItem"
import {
  serializeVendor,
  serializeMenuItem,
  type LeanVendor,
} from "@/lib/serializers"
import { getItemTag } from "@/lib/services/menuService"
import { getSubaccounts } from "@/lib/monnify"
import type { VendorFilterItem } from "@/types/vendor"
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
  let vendor = await VendorModel.findById(vendorId).lean()
  if (!vendor) return null

  // Programmatic auto-fix: If they have a subaccount code but no account number
  const rawVendor = vendor as unknown as LeanVendor & {
    paymentDetails?: { accountNumber?: string }
  }
  if (rawVendor.monnifySubAccountCode && !rawVendor.monnifyAccountNumber) {
    let syncedAccountNumber = ""
    let syncedBankCode = ""

    // 1. First try to salvage from legacy paymentDetails (if it exists in DB)
    if (rawVendor.paymentDetails?.accountNumber) {
      syncedAccountNumber = rawVendor.paymentDetails.accountNumber
      // We assume bankCode is correct or we fetch it below if needed
    } else {
      // 2. Fallback: Dynamically pull from Monnify using the subaccount code!
      try {
        const subaccounts = await getSubaccounts()
        const target = subaccounts.find(
          (s: {
            subAccountCode: string
            accountNumber: string
            bankCode: string
          }) => s.subAccountCode === rawVendor.monnifySubAccountCode
        )
        if (target) {
          syncedAccountNumber = target.accountNumber
          syncedBankCode = target.bankCode
        }
      } catch (err) {
        console.error("Failed to sync subaccount from Monnify", err)
      }
    }

    // If we found the missing details, save them to the DB permanently
    if (syncedAccountNumber) {
      const updateData: Record<string, string> = {
        monnifyAccountNumber: syncedAccountNumber,
      }
      if (syncedBankCode) updateData.monnifyBankCode = syncedBankCode

      vendor = await VendorModel.findByIdAndUpdate(
        vendorId,
        { $set: updateData },
        { new: true, strict: false }
      ).lean()
    }
  }

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

export async function getVendorReviews(
  slug: string,
  options: { page?: number; limit?: number; rating?: number } = {}
) {
  await dbConnect()

  const page = Math.max(1, options.page || 1)
  const limit = Math.max(1, Math.min(50, options.limit || 10))
  const skip = (page - 1) * limit

  const vendor = await VendorModel.findOne({ slug }).lean()
  if (!vendor) {
    throw new Error("Vendor not found")
  }

  const matchQuery: Record<string, unknown> = { vendorId: vendor._id }
  if (options.rating) {
    matchQuery.rating = options.rating
  }

  const reviews = await VendorFeedback.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "orderId",
        as: "orderData",
      },
    },
    {
      $unwind: {
        path: "$orderData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        id: "$_id",
        _id: 0,
        rating: 1,
        comments: 1,
        createdAt: 1,
        isAnonymous: 1,
        customerName: {
          $cond: {
            if: { $eq: ["$isAnonymous", true] },
            then: "Anonymous",
            else: { $ifNull: ["$orderData.customerName", "Verified Buyer"] },
          },
        },
      },
    },
  ])

  let statistics = null
  if (page === 1) {
    const distributionAgg = await VendorFeedback.aggregate([
      { $match: { vendorId: vendor._id } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ])

    let calculatedTotal = 0
    let calculatedStars = 0
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    distributionAgg.forEach((d) => {
      if (d._id >= 1 && d._id <= 5) {
        distribution[d._id as keyof typeof distribution] = d.count
        calculatedTotal += d.count
        calculatedStars += d._id * d.count
      }
    })

    statistics = {
      averageRating:
        calculatedTotal > 0 ? calculatedStars / calculatedTotal : 0,
      totalReviews: calculatedTotal,
      distribution,
    }
  }

  // Convert Date objects to strings since we are returning to the client/server component
  const serializedReviews = reviews.map(
    (r: {
      id: { toString: () => string }
      createdAt?: Date
      [key: string]: unknown
    }) => ({
      ...r,
      id: r.id.toString(),
      createdAt: r.createdAt?.toISOString() || null,
    })
  ) as unknown as import("@/types/vendor").VendorReview[]

  return {
    reviews: serializedReviews,
    page,
    hasMore: reviews.length === limit,
    ...(statistics && { statistics }),
  }
}

export async function getVendorDataBySlug(
  slug: string,
  options: { category?: string; q?: string } = {}
) {
  await dbConnect()

  const vendor = await VendorModel.findOne({
    slug,
    isActive: true,
    monnifyIntegrationStatus: "active",
  }).lean()

  if (!vendor) return null

  const menuQuery: Record<string, unknown> = {
    vendorId: vendor._id,
    isAvailable: true,
  }

  if (options.category && options.category !== "all") {
    menuQuery.category = options.category
  }

  if (options.q) {
    menuQuery.$or = [
      { name: { $regex: options.q, $options: "i" } },
      { description: { $regex: options.q, $options: "i" } },
    ]
  }

  const [menuItems, allCategoryDocs] = await Promise.all([
    MenuItem.find(menuQuery).sort({ createdAt: -1 }).lean(),
    MenuItem.distinct("category", { vendorId: vendor._id }),
  ])

  const mappedItems = menuItems.map((item) => ({
    ...serializeMenuItem(item),
    tag: getItemTag(item.price),
  }))

  return {
    vendor: serializeVendor(vendor as LeanVendor),
    menuItems: mappedItems,
    allCategories: allCategoryDocs,
  }
}
