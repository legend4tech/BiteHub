import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import PromoCode from "@/models/PromoCode"
import PromoCodeRedemption from "@/models/PromoCodeRedemption"
import { serializePromoCode } from "@/lib/serializers"
import { updatePromoSchema, idParamSchema } from "@/lib/schemas"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"
import { sendRewardSystemSecurityAlertEmail } from "@/lib/mail"

// ── GET /api/admin/promos/[id] ───────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "superadmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsedParams = idParamSchema.safeParse(await params)
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          error: "Invalid promo code ID",
          details: parsedParams.error.format(),
        },
        { status: 400 }
      )
    }
    const { id } = parsedParams.data
    await dbConnect()

    const promo = await PromoCode.findById(id).lean()
    if (!promo) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(serializePromoCode(promo), { status: 200 })
  } catch (error) {
    console.error("[GET /api/admin/promos/[id]]", error)
    return NextResponse.json(
      { error: "Failed to fetch promo code" },
      { status: 500 }
    )
  }
}

// ── PATCH /api/admin/promos/[id] ─────────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const parsedParams = idParamSchema.safeParse(await params)
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          error: "Invalid promo code ID",
          details: parsedParams.error.format(),
        },
        { status: 400 }
      )
    }
    const { id } = parsedParams.data
    const body = await req.json()
    const parsed = updatePromoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    await dbConnect()

    const updated = await PromoCode.findByIdAndUpdate(id, parsed.data, {
      new: true,
    }).lean()

    if (!updated) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      )
    }

    sendRewardSystemSecurityAlertEmail({
      action:
        Object.keys(parsed.data).length === 1 && "isActive" in parsed.data
          ? "Promo Code Status Toggled"
          : "Promo Code Modified",
      entityTitle: updated.code,
      adminName: session.user.name || "Admin",
      adminEmail: session.user.email || "Unknown",
      details: Object.entries(parsed.data).map(([key, val]) => ({
        label: key,
        value: String(val),
      })),
      dashboardPath: "/admin/promos",
    }).catch((err) =>
      console.error("Failed to send promo update alert email:", err)
    )

    return NextResponse.json(serializePromoCode(updated), { status: 200 })
  } catch (error) {
    console.error("[PATCH /api/admin/promos/[id]]", error)
    return NextResponse.json(
      { error: "Failed to update promo code" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const parsedParams = idParamSchema.safeParse(await params)
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          error: "Invalid promo code ID",
          details: parsedParams.error.format(),
        },
        { status: 400 }
      )
    }
    const { id } = parsedParams.data

    await dbConnect()

    const promo = await PromoCode.findById(id)
    if (!promo) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      )
    }

    const redemptionsCount = await PromoCodeRedemption.countDocuments({
      promoCodeId: promo._id,
    })

    if (redemptionsCount > 0) {
      // If code was already redeemed, don't delete history; soft deactivate
      promo.isActive = false
      await promo.save()

      sendRewardSystemSecurityAlertEmail({
        action: "Promo Code Deactivated",
        entityTitle: promo.code,
        adminName: session.user.name || "Admin",
        adminEmail: session.user.email || "Unknown",
        details: [
          {
            label: "Reason",
            value: "Soft-deactivated (has redemption history)",
          },
        ],
        dashboardPath: "/admin/promos",
      }).catch((err) =>
        console.error("Failed to send promo deactivation alert email:", err)
      )

      return NextResponse.json(
        { message: "Promo code has existing redemptions and was deactivated." },
        { status: 200 }
      )
    }

    await PromoCode.findByIdAndDelete(id)

    sendRewardSystemSecurityAlertEmail({
      action: "Promo Code Deleted",
      entityTitle: promo.code,
      adminName: session.user.name || "Admin",
      adminEmail: session.user.email || "Unknown",
      details: [{ label: "Status", value: "Permanently deleted" }],
      dashboardPath: "/admin/promos",
    }).catch((err) =>
      console.error("Failed to send promo delete alert email:", err)
    )

    return NextResponse.json(
      { message: "Promo code deleted successfully." },
      { status: 200 }
    )
  } catch (error) {
    console.error("[DELETE /api/admin/promos/[id]]", error)
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    )
  }
}
