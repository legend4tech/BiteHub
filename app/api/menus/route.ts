import { NextResponse } from "next/server";
import { QueryFilter } from "mongoose";
import dbConnect from "@/lib/db";
import MenuItem, { IMenuItem } from "@/models/MenuItem";
import Vendor from "@/models/Vendor";
import { serializeMenuItem } from "@/lib/serializers";

// Centralised tag logic — single source of truth.
// Previously this was duplicated across 3 route files and 2 page components.
export function getItemTag(price: number): string | null {
  return price > 1000 ? "🔥 Hot" : null;
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;
    const skip = (page - 1) * limit;

    // Properly typed query instead of `any`
    let query: QueryFilter<IMenuItem> = { isAvailable: true };

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

    // Use .lean() for plain JS objects — faster and less memory than
    // full Mongoose documents when we only need to serialize to JSON.
    const items = await MenuItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch only active vendors — no point including inactive ones in the map
    const vendors = await Vendor.find({ isActive: true }).select("name slug whatsappNumber").lean();

    const vendorMap = new Map<string, { name: string, slug: string }>();
    const vendorWhatsappNumberMap = new Map<string, string>();
    vendors.forEach((v) => {
      vendorMap.set(v._id.toString(), { name: v.name, slug: (v as any).slug });
      vendorWhatsappNumberMap.set(v._id.toString(), (v as any).whatsappNumber || "");
    });

    const mappedItems = items.map((item) => {
      const vendorData = vendorMap.get(item.vendorId.toString());
      return {
      ...serializeMenuItem(item),
      // Attach vendor name — falls back to "Campus Vendor" only if vendor
      // was deleted after item was created (orphaned item)
      vendorName: vendorData?.name || "Campus Vendor",
      vendorSlug: vendorData?.slug || "",
      vendorWhatsappNumber: vendorWhatsappNumberMap.get(item.vendorId.toString()) || "",
      // Tag computed in one place
      tag: getItemTag(item.price),
    };
    });

    return NextResponse.json(mappedItems);
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus" },
      { status: 500 }
    );
  }
}