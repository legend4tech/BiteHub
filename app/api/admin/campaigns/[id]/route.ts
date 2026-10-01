import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import {
  updateAdminCampaign,
  deactivateAdminCampaign,
} from "@/lib/services/gamificationService"
import { rewardCampaignFormSchema } from "@/lib/schemas/admin"
import { strictRateLimiter } from "@/lib/rate-limit"

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { success } = await strictRateLimiter.limit(
      `admin-campaign-${session.user.id}`
    )
    if (!success) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 })
    }

    const params = await props.params
    const body = await req.json()
    const parseResult = rewardCampaignFormSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    await dbConnect()
    const updatedCampaign = await updateAdminCampaign(
      params.id,
      parseResult.data
    )

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
    })
  } catch (error) {
    console.error("[PUT /api/admin/campaigns/[id]]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { success } = await strictRateLimiter.limit(
      `admin-campaign-${session.user.id}`
    )
    if (!success) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 })
    }

    const params = await props.params

    await dbConnect()
    const updatedCampaign = await deactivateAdminCampaign(params.id)

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/campaigns/[id]]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
