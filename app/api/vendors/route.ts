import { NextResponse } from "next/server"
import { getVendors } from "@/lib/services/vendorService"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const result = await getVendors({
      q: searchParams.get("q") || undefined,
      school: searchParams.get("school") || undefined,
      campus: searchParams.get("campus") || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
    })

    return NextResponse.json(result.vendors)
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    )
  }
}
