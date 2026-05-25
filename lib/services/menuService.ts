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
}

/// ─── List menu items (paginated, filtered) ─────────────────────────────────────

export async function getMenus(options: GetMenusOptions = {}) {
  const { q, category, school, campus, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  await dbConnect()

  let query: Record<string, unknown> = { isAvailable: true }

  // ALWAYS filter to vendors that are active AND have payment details configured
  const vendorFilter: Record<string, unknown> = {
    isActive: true,
    $or: [
      {
        "paymentDetails.bankName": { $exists: true, $ne: "" },
        "paymentDetails.accountNumber": { $exists: true, $ne: "" },
      },
      { "paymentDetails.acceptsCashOnDelivery": true },
    ],
  }

  if (school) vendorFilter.school = school
  if (campus) vendorFilter.campus = campus

  const validVendors = await Vendor.find(vendorFilter)
    .select("_id name slug whatsappNumber")
    .lean<
      Array<{
        _id: unknown
        name: string
        slug: string
        whatsappNumber?: string
      }>
    >()
  query.vendorId = { $in: validVendors.map((v) => v._id) }

  if (category && category !== "all") {
    query.category = category
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

  const [items, totalItems] = await Promise.all([
    MenuItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    MenuItem.countDocuments(query),
  ])

  // Build vendor maps for name/slug/whatsapp enrichment using the already fetched validVendors
  const vendorMap = new Map<string, { name: string; slug: string }>()
  const vendorWhatsappMap = new Map<string, string>()
  validVendors.forEach((v) => {
    vendorMap.set(String(v._id), { name: v.name, slug: v.slug })
    vendorWhatsappMap.set(String(v._id), v.whatsappNumber || "")
  })

  const mappedItems = items
    .map((item) => {
      const base = serializeMenuItem(item)
      if (!base) return null // guard: should never happen for .lean() docs

      const vendorData = vendorMap.get(item.vendorId.toString())
      return {
        ...base,
        vendorName: vendorData?.name || "Campus Vendor",
        vendorSlug: vendorData?.slug || "",
        vendorWhatsappNumber:
          vendorWhatsappMap.get(item.vendorId.toString()) || "",
        tag: getItemTag(item.price),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return { items: mappedItems, totalItems }
}
