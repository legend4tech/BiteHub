import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import { toggleCampaignStatus } from "@/lib/services/gamificationService"
import { strictRateLimiter } from "@/lib/rate-limit"

export async function PATCH(
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
    const updatedCampaign = await toggleCampaignStatus(params.id)

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, campaign: updatedCampaign })
  } catch (error) {
    console.error("[PATCH /api/admin/campaigns/[id]/toggle]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
