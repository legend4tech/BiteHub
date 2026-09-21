export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getVendorsForFilter } from "@/lib/services/vendorService"

// ── GET /api/vendors/public ───────────────────────────────────────────────────

import { vendorsPublicQuerySchema as querySchema } from "@/lib/schemas"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const parsed = querySchema.safeParse({
      school: searchParams.get("school") ?? undefined,
      campus: searchParams.get("campus") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query params", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const result = await getVendorsForFilter(parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/vendors/public]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
