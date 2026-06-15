export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import MenuItemModel from "@/models/MenuItem"
import { getItemTag } from "@/lib/services/menuService"
import { serializeVendor, serializeMenuItem } from "@/lib/serializers"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect()
    const { slug } = await params

    // .lean() here because we only need plain data to serialize —
    // no need for Mongoose document methods
    const vendor = await VendorModel.findOne({
      slug,
      isActive: true,
      monnifyIntegrationStatus: "active",
    }).lean()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const q = searchParams.get("q")

    // Only show available items on the public profile as requested by the vendor
    const menuQuery: Record<string, unknown> = {
      vendorId: vendor._id,
      isAvailable: true,
    }

    if (category && category !== "all") {
      menuQuery.category = category
    }

    if (q) {
      menuQuery.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ]
    }

    const [menuItems, allCategoryDocs] = await Promise.all([
      MenuItemModel.find(menuQuery).sort({ createdAt: -1 }).lean(),
      // Fetch all distinct categories this vendor has (ignoring current filter),
      // so the tab list stays complete when the user is on a filtered view.
      MenuItemModel.distinct("category", { vendorId: vendor._id }),
    ])

    // Attach tag using the shared utility so logic stays in one place
    const mappedItems = menuItems.map((item) => ({
      ...serializeMenuItem(item),
      tag: getItemTag(item.price),
    }))

    return NextResponse.json({
      vendor: serializeVendor(vendor),
      menuItems: mappedItems,
      allCategories: allCategoryDocs, // all vendor categories, unfiltered
    })
  } catch (error) {
    console.error("Error fetching vendor by slug:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    )
  }
}
