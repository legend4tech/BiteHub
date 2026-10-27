import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import PromoCode, { IPromoCode } from "@/models/PromoCode"
import { createPromoCodeSchema } from "@/lib/schemas"
import { serializePromoCode } from "@/lib/serializers"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"
import { sendRewardSystemSecurityAlertEmail } from "@/lib/mail"

// ── GET /api/admin/promos ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "superadmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const promos = await PromoCode.find()
      .sort({ createdAt: -1 })
      .lean<IPromoCode[]>()

    const serialized = promos.map(serializePromoCode).filter(Boolean)
    return NextResponse.json(serialized, { status: 200 })
  } catch (error) {
    console.error("[GET /api/admin/promos]", error)
    return NextResponse.json(
      { error: "Failed to fetch promo codes" },
      { status: 500 }
    )
  }
}

// ── POST /api/admin/promos ────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "superadmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(
        `admin-promo-${session.user.id}`
      )
      if (!success) {
        return NextResponse.json(
          { error: "Too Many Requests" },
          { status: 429 }
        )
      }
    }

    const body = await req.json()
    const parsed = createPromoCodeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid promo code data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    await dbConnect()

    const existing = await PromoCode.findOne({ code: parsed.data.code })
    if (existing) {
      return NextResponse.json(
        { error: `Promo code "${parsed.data.code}" already exists.` },
        { status: 409 }
      )
    }

    const created = await PromoCode.create(parsed.data)
    const serialized = serializePromoCode(created.toObject())

    // Trigger security alert email to superadmins
    sendRewardSystemSecurityAlertEmail({
      action: "Promo Code Created",
      entityTitle: created.code,
      adminName: session.user.name || "Admin",
      adminEmail: session.user.email || "Unknown",
      details: [
        { label: "Discount Type", value: created.discountType },
        {
          label: "Discount Value",
          value:
            created.discountType === "PERCENTAGE"
              ? `${created.discountValue}%`
              : `₦${(created.discountValueInKobo || 0) / 100}`,
        },
        {
          label: "Max Redemptions",
          value: `${created.maxRedemptions || "Unlimited"}`,
        },
        { label: "Active", value: created.isActive ? "Yes" : "No" },
      ],
      dashboardPath: "/admin/promos",
    }).catch((err) =>
      console.error("Failed to send promo created alert email:", err)
    )

    return NextResponse.json(serialized, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/promos]", error)
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    )
  }
}
