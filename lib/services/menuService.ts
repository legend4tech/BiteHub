/**
 * menuService.ts
 *
 * Single source of truth for all menu item DB queries.
 * Used by BOTH /api/menus route (client-side React Query)
 * AND server pages (app/menus/page.tsx, app/page.tsx landing section).
 */

import dbConnect from "@/lib/db"
import MenuItem from "@/models/MenuItem"
import Vendor from "@/models/Vendor"
import { serializeMenuItem } from "@/lib/serializers"
import { DISCOVERY_SCORE } from "@/lib/constants"
import type mongoose from "mongoose"
import type { SortOrder } from "mongoose"
import { isItemAvailableNow } from "@/lib/timeUtils"

// Tag logic — single definition for the entire codebase
export function getItemTag(price: number): string | null {
  return price > 1000 ? "🔥 Hot" : null
}

export interface GetMenusOptions {
  q?: string
  category?: string
  school?: string
  campus?: string
  page?: number
  limit?: number
  sortBy?: string
  availableOnly?: boolean
  vendorId?: string // filter to a specific vendor
}

/// ─── List menu items (paginated, filtered) ─────────────────────────────────────

export async function getMenus(options: GetMenusOptions = {}) {
  const {
    q,
    category,
    school,
    campus,
    page = 1,
    limit = 20,
    sortBy,
    availableOnly,
    vendorId,
  } = options
  const skip = (page - 1) * limit

  await dbConnect()

  let query: Record<string, unknown> = { isAvailable: true }

  // ALWAYS filter to vendors that are active AND have payment details configured
  const vendorFilter: Record<string, unknown> = {
    isActive: true,
    monnifyIntegrationStatus: "active",
  }

  if (school) vendorFilter.school = school
  if (campus) vendorFilter.campus = campus

  // Hoisted here so the forEach below can populate them before the DB item query
  const vendorMap = new Map<
    string,
    {
      name: string
      slug: string
      prepTime: string
      isActive: boolean
      isFeatured: boolean
      rating: number
      ratingCount: number
    }
  >()
  const vendorWhatsappMap = new Map<string, string>()

  // When filtering by a specific vendor, we still need its details for the UI cards
  if (vendorId) {
    // Fetch the vendor regardless of status so we have its actual name and isActive state
    const specificVendor = await Vendor.findOne({ _id: vendorId })
      .select(
        "_id name slug whatsappNumber prepTime isActive monnifyIntegrationStatus isFeatured rating ratingCount"
      )
      .lean<{
        _id: unknown
        name: string
        slug: string
        whatsappNumber?: string
        prepTime?: string
        isActive: boolean
        monnifyIntegrationStatus?: string
        isFeatured?: boolean
        rating?: number
        ratingCount?: number
      }>()

    if (specificVendor) {
      vendorMap.set(String(specificVendor._id), {
        name: specificVendor.name,
        slug: specificVendor.slug,
        prepTime: specificVendor.prepTime || "",
        isActive:
          specificVendor.isActive &&
          specificVendor.monnifyIntegrationStatus === "active",
        isFeatured: specificVendor.isFeatured ?? false,
        rating: specificVendor.rating ?? 0,
        ratingCount: specificVendor.ratingCount ?? 0,
      })
      vendorWhatsappMap.set(
        String(specificVendor._id),
        specificVendor.whatsappNumber || ""
      )
    }

    // If we only want available items, but this specific vendor is closed,
    // force the query to return zero results.
    const isVendorOrderable =
      specificVendor?.isActive &&
      specificVendor?.monnifyIntegrationStatus === "active"
    if (availableOnly && !isVendorOrderable) {
      query.vendorId = "000000000000000000000000" // impossible ID
    } else {
      query.vendorId = vendorId
    }
  } else {
    const validVendors = await Vendor.find(vendorFilter)
      .select(
        "_id name slug whatsappNumber prepTime isActive isFeatured rating ratingCount"
      )
      .lean<
        Array<{
          _id: unknown
          name: string
          slug: string
          whatsappNumber?: string
          prepTime?: string
          isActive: boolean
          isFeatured?: boolean
          rating?: number
          ratingCount?: number
        }>
      >()
    query.vendorId = { $in: validVendors.map((v) => v._id) }

    // Populate vendor maps for use during item serialization
    validVendors.forEach((v) => {
      vendorMap.set(String(v._id), {
        name: v.name,
        slug: v.slug,
        prepTime: v.prepTime || "",
        isActive: v.isActive,
        isFeatured: v.isFeatured ?? false,
        rating: v.rating ?? 0,
        ratingCount: v.ratingCount ?? 0,
      })
      vendorWhatsappMap.set(String(v._id), v.whatsappNumber || "")
    })
  }

  if (category && category !== "all") {
    query.category = category
  }

  if (availableOnly) {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = { timeZone: "Africa/Lagos" }
    const currentDayOfWeek = new Intl.DateTimeFormat("en-US", {
      ...options,
      weekday: "long",
    }).format(now)
    const timeString = new Intl.DateTimeFormat("en-US", {
      ...options,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now)

    query.$and = [
      { isAvailable: true },
      {
        $or: [
          { availableDays: { $size: 0 } },
          { availableDays: { $exists: false } },
          { availableDays: currentDayOfWeek },
        ],
      },
      {
        $or: [
          // No schedule or quantity sold out (handled by quantityAvailable > 0 or null)
          { availableFrom: null, availableTo: null },
          { availableFrom: "", availableTo: "" },
          {
            availableFrom: { $exists: false },
            availableTo: { $exists: false },
          },
          // Simple interval
          {
            $and: [
              { $expr: { $lte: ["$availableFrom", "$availableTo"] } },
              { availableFrom: { $lte: timeString } },
              { availableTo: { $gte: timeString } },
            ],
          },
          // Cross-midnight interval
          {
            $and: [
              { $expr: { $gt: ["$availableFrom", "$availableTo"] } },
              {
                $or: [
                  { availableFrom: { $lte: timeString } },
                  { availableTo: { $gte: timeString } },
                ],
              },
            ],
          },
        ],
      },
      {
        $or: [
          { quantityAvailable: null },
          { quantityAvailable: { $exists: false } },
          { quantityAvailable: { $gt: 0 } },
        ],
      },
    ]
  }

  if (q) {
    query = {
      ...query,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    }
  }

  let sortQuery: Record<string, SortOrder> = { createdAt: -1, _id: -1 }
  if (sortBy === "price_asc") sortQuery = { price: 1, _id: -1 }
  else if (sortBy === "price_desc") sortQuery = { price: -1, _id: -1 }
  else if (sortBy === "name_asc") sortQuery = { name: 1, _id: -1 }

  const [items, totalItems] = await Promise.all([
    MenuItem.find(query).sort(sortQuery).skip(skip).limit(limit).lean(),
    MenuItem.countDocuments(query),
  ])

  // vendorMap and vendorWhatsappMap are declared and populated above

  const mappedItems = items
    .map((item) => {
      const base = serializeMenuItem(item)
      if (!base) return null

      const vendorData = vendorMap.get(item.vendorId.toString())
      return {
        ...base,
        vendorName: vendorData?.name || "Campus Vendor",
        vendorSlug: vendorData?.slug || "",
        vendorIsActive: vendorData?.isActive ?? true,
        vendorWhatsappNumber:
          vendorWhatsappMap.get(item.vendorId.toString()) || "",
        vendorPrepTime: vendorData?.prepTime || "",
        tag: getItemTag(item.price),
        isAvailableNow: base.isAvailableNow,
        // Attach vendor scoring data so discovery sort can use it
        _vendorIsFeatured: vendorData?.isFeatured ?? false,
        _vendorRating: vendorData?.rating ?? 0,
        _vendorRatingCount: vendorData?.ratingCount ?? 0,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  // ── Discovery score re-ranking ──────────────────────────────────────────────
  // Only applied when sortBy is "none" (Recommended) and not filtering by a
  // specific vendor (vendor filter has its own natural order).
  let finalItems = mappedItems as typeof mappedItems

  if (!sortBy && !vendorId) {
    const now = Date.now()

    const scored = mappedItems.map((item) => {
      const ageMs = now - new Date(item.createdAt).getTime()
      const ageInDays = ageMs / (1000 * 60 * 60 * 24)
      const recencyBoost = Math.max(0, DISCOVERY_SCORE.RECENCY_MAX - ageInDays) // decays to 0 over RECENCY_DECAY_DAYS
      const featuredBoost = item._vendorIsFeatured
        ? DISCOVERY_SCORE.FEATURED_BOOST
        : 0
      const ratingScore = item._vendorRating * DISCOVERY_SCORE.RATING_MULTIPLIER
      const reviewCountScore =
        Math.log(item._vendorRatingCount + 1) *
        DISCOVERY_SCORE.REVIEW_COUNT_MULTIPLIER
      const availabilityBoost = item.isAvailableNow
        ? DISCOVERY_SCORE.AVAILABILITY_BOOST
        : 0
      const score =
        featuredBoost +
        ratingScore +
        reviewCountScore +
        availabilityBoost +
        recencyBoost
      return { item, score }
    })

    scored.sort((a, b) => b.score - a.score)

    // Vendor diversity cap: interleave so no vendor takes consecutive slots
    // beyond MAX_CONSECUTIVE_VENDOR_SLOTS.
    const MAX_CONSECUTIVE = DISCOVERY_SCORE.MAX_CONSECUTIVE_VENDOR_SLOTS
    const result: typeof mappedItems = []
    const pool = scored.map((s) => s.item)
    const vendorCounts = new Map<string, number>()
    let lastVendorId: string | null = null
    let consecutiveCount = 0

    while (pool.length > 0) {
      // Find next eligible item (doesn't exceed consecutive limit)
      let idx = pool.findIndex((item) => {
        const vid = item.vendorId
        if (vid !== lastVendorId) return true
        return consecutiveCount < MAX_CONSECUTIVE
      })

      // If no alternative vendor exists to interleave, we must pick the
      // next item anyway to avoid dropping results.
      if (idx === -1) {
        idx = 0
      }

      const item = pool.splice(idx, 1)[0]
      if (item.vendorId === lastVendorId) {
        consecutiveCount++
      } else {
        consecutiveCount = 1
        lastVendorId = item.vendorId
      }
      vendorCounts.set(
        item.vendorId,
        (vendorCounts.get(item.vendorId) ?? 0) + 1
      )
      result.push(item)
    }

    finalItems = result
  }

  // Strip internal scoring props before returning
  const cleanItems = finalItems.map(
    ({ _vendorIsFeatured, _vendorRating, _vendorRatingCount, ...rest }) => rest
  )

  return { items: cleanItems, totalItems }
}

/// ─── Vendor Dashboard: Manage menu items ─────────────────────────────────────

export async function getVendorMenuItems(
  vendorId: mongoose.Types.ObjectId | string,
  search?: string,
  category?: string
) {
  await dbConnect()

  // Fetch all items for stats and full category list
  const allItemsDocs = await MenuItem.find({ vendorId })
    .sort({ createdAt: -1, _id: -1 })
    .lean()

  const allItems = allItemsDocs
    .map(serializeMenuItem)
    .filter((item): item is NonNullable<typeof item> => item !== null)

  // Fetch filtered items for rendering
  const filter: Record<string, unknown> = { vendorId }
  if (search) filter.name = { $regex: search, $options: "i" }
  if (category && category !== "all") filter.category = category

  const filteredDocs = await MenuItem.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .lean()

  const filteredItems = filteredDocs
    .map(serializeMenuItem)
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return { allItems, filteredItems }
}

/// ─── Public: Single Menu Item ──────────────────────────────────────────────────

export async function getMenuItemById(id: string) {
  await dbConnect()

  // 1. Fetch the requested item
  const itemDoc = await MenuItem.findOne({ _id: id, isAvailable: true }).lean()
  if (!itemDoc) return null

  // 2. Fetch the vendor to ensure they are active & Monnify integrated
  const vendor = await Vendor.findOne({
    _id: itemDoc.vendorId,
    isActive: true,
    monnifyIntegrationStatus: "active",
  }).lean()

  if (!vendor) return null

  // 3. Serialize the main item
  const baseItem = serializeMenuItem(itemDoc)
  if (!baseItem) return null

  const mainItem = {
    ...baseItem,
    vendorName: vendor.name,
    vendorSlug: vendor.slug,
    vendorIsActive: vendor.isActive,
    vendorWhatsappNumber: vendor.whatsappNumber || "",
    vendorPrepTime: vendor.prepTime || "",
    tag: getItemTag(itemDoc.price),
  }

  // 4. Fetch related items (same vendor, available, not this item, limit 4)
  const relatedDocs = await MenuItem.find({
    vendorId: vendor._id,
    isAvailable: true,
    _id: { $ne: itemDoc._id },
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(4)
    .lean()

  const relatedItems = relatedDocs
    .map((doc) => {
      const base = serializeMenuItem(doc)
      if (!base) return null
      return {
        ...base,
        vendorName: vendor.name,
        vendorSlug: vendor.slug,
        vendorWhatsappNumber: vendor.whatsappNumber || "",
        vendorPrepTime: vendor.prepTime || "",
        tag: getItemTag(doc.price),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return { mainItem, relatedItems, vendor }
}
