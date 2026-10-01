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
import type { LeanVendor, LeanMenuItem } from "@/lib/serializers"
import type mongoose from "mongoose"
import type { SortOrder } from "mongoose"
import { escapeRegex } from "@/lib/utils"

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

  const baseQuery: Record<string, unknown> = { isAvailable: true }

  // ALWAYS filter to vendors that are active AND have payment details configured
  const vendorFilter: Record<string, unknown> = {
    isActive: true,
    monnifyIntegrationStatus: "active",
  }

  if (school) vendorFilter.school = school
  if (campus) vendorFilter.campus = campus

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

  const allValidVendorIds: string[] = []
  const orderableVendorIds: string[] = []
  let isSpecificVendorOrderable = false

  if (vendorId) {
    const specificVendor = await Vendor.findOne({ _id: vendorId })
      .select(
        "_id name slug whatsappNumber prepTime isActive isOpen monnifyIntegrationStatus isFeatured rating ratingCount"
      )
      .lean<LeanVendor>()

    if (specificVendor) {
      // For frontend display, combine isActive and isOpen
      const isVendorOrderable =
        specificVendor.isActive &&
        specificVendor.monnifyIntegrationStatus === "active" &&
        specificVendor.isOpen !== false
      isSpecificVendorOrderable = isVendorOrderable

      vendorMap.set(String(specificVendor._id), {
        name: specificVendor.name,
        slug: specificVendor.slug,
        prepTime: specificVendor.prepTime || "",
        isActive: isVendorOrderable,
        isFeatured: specificVendor.isFeatured ?? false,
        rating: specificVendor.rating ?? 0,
        ratingCount: specificVendor.ratingCount ?? 0,
      })
      vendorWhatsappMap.set(
        String(specificVendor._id),
        specificVendor.whatsappNumber || ""
      )
      allValidVendorIds.push(String(specificVendor._id))
      if (isVendorOrderable) orderableVendorIds.push(String(specificVendor._id))
    }
  } else {
    const validVendors = await Vendor.find(vendorFilter)
      .select(
        "_id name slug whatsappNumber prepTime isActive isOpen isFeatured rating ratingCount"
      )
      .lean<LeanVendor[]>()

    validVendors.forEach((v) => {
      const isVendorOrderable = v.isActive && v.isOpen !== false
      allValidVendorIds.push(String(v._id))
      if (isVendorOrderable) orderableVendorIds.push(String(v._id))

      vendorMap.set(String(v._id), {
        name: v.name,
        slug: v.slug,
        prepTime: v.prepTime || "",
        isActive: isVendorOrderable,
        isFeatured: v.isFeatured ?? false,
        rating: v.rating ?? 0,
        ratingCount: v.ratingCount ?? 0,
      })
      vendorWhatsappMap.set(String(v._id), v.whatsappNumber || "")
    })
  }

  if (category && category !== "all") {
    baseQuery.category = category
  }

  if (q) {
    const escapedQ = escapeRegex(q)
    baseQuery.$or = [
      { name: { $regex: escapedQ, $options: "i" } },
      { description: { $regex: escapedQ, $options: "i" } },
      { category: { $regex: escapedQ, $options: "i" } },
    ]
  }

  const now = new Date()
  const dateOptions: Intl.DateTimeFormatOptions = { timeZone: "Africa/Lagos" }
  const currentDayOfWeek = new Intl.DateTimeFormat("en-US", {
    ...dateOptions,
    weekday: "long",
  }).format(now)
  const timeString = new Intl.DateTimeFormat("en-US", {
    ...dateOptions,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now)

  const availCondition = [
    { isAvailable: true },
    {
      $or: [
        // 1. Pre-orders that haven't expired yet bypass the daily schedule
        { isPreorder: true, preorderEndDate: { $gt: now } },
        // 2. Regular items follow the daily/time schedule
        {
          isPreorder: { $ne: true },
          $and: [
            {
              $or: [
                { availableDays: { $size: 0 } },
                { availableDays: { $exists: false } },
                { availableDays: currentDayOfWeek },
              ],
            },
            {
              $or: [
                // No schedule
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

  let sortQuery: Record<string, SortOrder> = {
    baseDiscoveryScore: -1,
    createdAt: -1,
    _id: -1,
  }
  if (sortBy === "price_asc") sortQuery = { price: 1, _id: -1 }
  else if (sortBy === "price_desc") sortQuery = { price: -1, _id: -1 }
  else if (sortBy === "name_asc") sortQuery = { name: 1, _id: -1 }

  let items: LeanMenuItem[] = []
  let totalItems = 0

  if (availableOnly) {
    const queryA = {
      ...baseQuery,
      vendorId: vendorId
        ? isSpecificVendorOrderable
          ? vendorId
          : "000000000000000000000000"
        : { $in: orderableVendorIds },
      $and: availCondition,
    }
    const [fetchedItems, count] = await Promise.all([
      MenuItem.find(queryA).sort(sortQuery).skip(skip).limit(limit).lean(),
      MenuItem.countDocuments(queryA),
    ])
    items = fetchedItems
    totalItems = count
  } else {
    // Two-Tier Fetch
    const queryA = {
      ...baseQuery,
      vendorId: vendorId
        ? isSpecificVendorOrderable
          ? vendorId
          : "000000000000000000000000"
        : { $in: orderableVendorIds },
      $and: availCondition,
    }

    const queryU: Record<string, unknown> = {
      ...baseQuery,
      vendorId: vendorId ? vendorId : { $in: allValidVendorIds },
    }

    if (vendorId) {
      if (!isSpecificVendorOrderable) {
        // Vendor is fully closed, all their items are unavailable
        queryU.$or = [{}]
      } else {
        queryU.$or = [{ $nor: [{ $and: availCondition }] }]
      }
    } else {
      queryU.$or = [
        { vendorId: { $nin: orderableVendorIds } },
        { $nor: [{ $and: availCondition }] },
      ]
    }

    const [countA, countU] = await Promise.all([
      MenuItem.countDocuments(queryA),
      MenuItem.countDocuments(queryU),
    ])
    totalItems = countA + countU

    if (skip < countA) {
      const fetchedFromA = await MenuItem.find(queryA)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean()
      items = [...fetchedFromA]

      if (items.length < limit) {
        const remaining = limit - items.length
        const fetchedFromU = await MenuItem.find(queryU)
          .sort(sortQuery)
          .skip(0)
          .limit(remaining)
          .lean()
        items = [...items, ...fetchedFromU]
      }
    } else {
      const skipU = skip - countA
      const fetchedFromU = await MenuItem.find(queryU)
        .sort(sortQuery)
        .skip(skipU)
        .limit(limit)
        .lean()
      items = [...fetchedFromU]
    }
  }

  const mappedItems = items
    .map((item: LeanMenuItem) => {
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
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return { items: mappedItems, totalItems }
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
  if (search) filter.name = { $regex: escapeRegex(search), $options: "i" }
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
