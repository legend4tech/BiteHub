export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getMenus } from "@/lib/services/menuService"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const result = await getMenus({
      q: searchParams.get("q") || undefined,
      category: searchParams.get("category") || undefined,
      school: searchParams.get("school") || undefined,
      campus: searchParams.get("campus") || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "30", 10),
      sortBy: searchParams.get("sortBy") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      availableOnly: searchParams.get("availableOnly") === "true",
    })

    return NextResponse.json(result.items)
  } catch (error) {
    console.error("Error fetching menus:", error)
    return NextResponse.json(
      { error: "Failed to fetch menus" },
      { status: 500 }
    )
  }
}
