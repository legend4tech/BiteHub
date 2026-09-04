export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getVendorDataBySlug } from "@/lib/services/vendorService"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || undefined
    const q = searchParams.get("q") || undefined
    const { slug } = await params

    const data = await getVendorDataBySlug(slug, { category, q })

    if (!data) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching vendor by slug:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    )
  }
}
