import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import PromoCode from "@/models/PromoCode"
import PromoCodeRedemption from "@/models/PromoCodeRedemption"
import { serializePromoCode } from "@/lib/serializers/promoSerializer"
import { z } from "zod"

const updatePromoSchema = z.object({
  isActive: z.boolean().optional(),
  budgetAllocatedInKobo: z.number().int().min(0).optional(),
  endDate: z.coerce.date().optional().nullable(),
  maxRedemptions: z.number().int().min(1).optional().nullable(),
})

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

    const { id } = await params
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

    const { id } = await params
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
      return NextResponse.json(
        { message: "Promo code has existing redemptions and was deactivated." },
        { status: 200 }
      )
    }

    await PromoCode.findByIdAndDelete(id)
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
