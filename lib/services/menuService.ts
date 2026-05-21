/**
 * menuService.ts
 *
 * Single source of truth for all menu item DB queries.
 * Used by BOTH /api/menus route (client-side React Query)
 * AND server pages (app/menus/page.tsx, app/page.tsx landing section).
 */

import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Vendor from "@/models/Vendor";
import { serializeMenuItem } from "@/lib/serializers";

// Tag logic — single definition for the entire codebase
export function getItemTag(price: number): string | null {
  return price > 1000 ? "🔥 Hot" : null;
}

export interface GetMenusOptions {
  q?: string;
  category?: string;
  school?: string;
  campus?: string;
  page?: number;
  limit?: number;
}

/// ─── List menu items (paginated, filtered) ─────────────────────────────────────

export async function getMenus(options: GetMenusOptions = {}) {
  const { q, category, school, campus, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  await dbConnect();

  let query: Record<string, unknown> = { isAvailable: true };

  // Filter by campus: resolve matching vendor IDs first
  if (school || campus) {
    const vendorFilter: Record<string, unknown> = { isActive: true };
    if (school) vendorFilter.school = school;
    if (campus) vendorFilter.campus = campus;

    const campusVendors = await Vendor.find(vendorFilter).select("_id").lean();
    query.vendorId = { $in: campusVendors.map((v) => v._id) };
  }

  if (category && category !== "all") {
    query.category = category;
  }

  if (q) {
    query = {
      ...query,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    };
  }

  const [items, totalItems] = await Promise.all([
    MenuItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    MenuItem.countDocuments(query),
  ]);

  // Build vendor maps for name/slug/whatsapp enrichment
  const vendorFilter: Record<string, unknown> = { isActive: true };
  if (school) vendorFilter.school = school;
  if (campus) vendorFilter.campus = campus;

  const vendors = await Vendor.find(vendorFilter)
    .select("name slug whatsappNumber")
    .lean();

  const vendorMap = new Map<string, { name: string; slug: string }>();
  const vendorWhatsappMap = new Map<string, string>();
  vendors.forEach((v) => {
    vendorMap.set(v._id.toString(), { name: v.name, slug: (v as any).slug });
    vendorWhatsappMap.set(v._id.toString(), (v as any).whatsappNumber || "");
  });

  const mappedItems = items
    .map((item) => {
      const base = serializeMenuItem(item);
      if (!base) return null; // guard: should never happen for .lean() docs

      const vendorData = vendorMap.get(item.vendorId.toString());
      return {
        ...base,
        vendorName: vendorData?.name || "Campus Vendor",
        vendorSlug: vendorData?.slug || "",
        vendorWhatsappNumber: vendorWhatsappMap.get(item.vendorId.toString()) || "",
        tag: getItemTag(item.price),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return { items: mappedItems, totalItems };
}
