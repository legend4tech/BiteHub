import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPromoRedemptionsQuerySchema } from "@/lib/schemas"
import { getPromoRedemptions } from "@/lib/services/promoCodeService"

// ── GET /api/admin/promos/redemptions ─────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "superadmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const rawQuery = {
      promoCodeId: searchParams.get("promoCodeId") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    }

    const parsed = getPromoRedemptionsQuerySchema.safeParse(rawQuery)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const result = await getPromoRedemptions(parsed.data)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[GET /api/admin/promos/redemptions]", error)
    return NextResponse.json(
      { error: "Failed to fetch redemptions" },
      { status: 500 }
    )
  }
}
