import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import { validatePromoCodeInputSchema } from "@/lib/schemas"
import { validatePromoCode } from "@/lib/services/promoCodeService"
import Customer from "@/models/Customer"
import MenuItem from "@/models/MenuItem"

// ── POST /api/customer/promo/validate ─────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // 1. Auth check (NextAuth session)
    const session = await auth()
    // Note: Rate limiting for this mutation route is handled at the Edge by proxy.ts

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error:
            "Please sign in or create an account to use promo codes with your BiteHub Wallet.",
          requiresSignup: true,
        },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = validatePromoCodeInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid promo request data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    await dbConnect()

    const customer = await Customer.findOne({
      email: session.user.email.toLowerCase(),
    })
      .select("_id")
      .lean()

    if (!customer) {
      return NextResponse.json(
        {
          error:
            "Customer account not found. Please create an account to use promo codes.",
          requiresSignup: true,
        },
        { status: 401 }
      )
    }

    const customerId = customer._id.toString()

    // Sanitize item prices against ground-truth database records to prevent client spoofing
    const itemIds = parsed.data.items.map((i) => i.menuItemId)
    const dbMenuItems = await MenuItem.find({
      _id: { $in: itemIds },
      vendorId: parsed.data.vendorId,
    })
      .select("_id priceInKobo")
      .lean()

    const dbPriceMap = new Map(
      dbMenuItems.map((m: { _id: unknown; priceInKobo: number }) => [
        String(m._id),
        m.priceInKobo,
      ])
    )

    const sanitizedItems = parsed.data.items.map((item) => ({
      menuItemId: item.menuItemId,
      priceInKobo: dbPriceMap.get(item.menuItemId) ?? item.priceInKobo,
      quantity: item.quantity,
    }))

    const result = await validatePromoCode({
      code: parsed.data.code,
      customerId,
      vendorId: parsed.data.vendorId,
      campus: parsed.data.campus,
      school: parsed.data.school,
      items: sanitizedItems,
    })

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[POST /api/customer/promo/validate]", error)
    return NextResponse.json(
      { error: "Failed to validate promo code" },
      { status: 500 }
    )
  }
}
