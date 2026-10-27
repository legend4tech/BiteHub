import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import { toggleCampaignStatus } from "@/lib/services/gamificationQueryService"
import { strictRateLimiter } from "@/lib/rate-limit"
import { sendRewardSystemSecurityAlertEmail } from "@/lib/mail"
import { idParamSchema } from "@/lib/schemas"

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

    const parsedParams = idParamSchema.safeParse(await props.params)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid campaign ID", details: parsedParams.error.flatten() },
        { status: 400 }
      )
    }
    const { id } = parsedParams.data

    await dbConnect()
    const updatedCampaign = await toggleCampaignStatus(id)

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    sendRewardSystemSecurityAlertEmail({
      action: "Reward Campaign Status Toggled",
      entityTitle: updatedCampaign.title || "Reward Campaign",
      adminName: session.user.name || "Admin",
      adminEmail: session.user.email || "Unknown",
      details: [
        {
          label: "New Status",
          value: updatedCampaign.isActive ? "Active" : "Inactive",
        },
      ],
      dashboardPath: "/admin/campaigns",
    }).catch((err) =>
      console.error("Failed to send reward campaign toggle alert email:", err)
    )

    return NextResponse.json({ success: true, campaign: updatedCampaign })
  } catch (error) {
    console.error("[PATCH /api/admin/campaigns/[id]/toggle]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
