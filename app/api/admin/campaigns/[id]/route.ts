import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import {
  updateAdminCampaign,
  deactivateAdminCampaign,
} from "@/lib/services/gamificationQueryService"
import { rewardCampaignFormSchema, idParamSchema } from "@/lib/schemas"
import { strictRateLimiter } from "@/lib/rate-limit"
import { sendRewardSystemSecurityAlertEmail } from "@/lib/mail"

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

    const parsedParams = idParamSchema.safeParse(await props.params)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid campaign ID", details: parsedParams.error.flatten() },
        { status: 400 }
      )
    }
    const { id } = parsedParams.data
    const body = await req.json()
    const parseResult = rewardCampaignFormSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    await dbConnect()
    const updatedCampaign = await updateAdminCampaign(id, parseResult.data)

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    sendRewardSystemSecurityAlertEmail({
      action: "Reward Campaign Modified",
      entityTitle: updatedCampaign.title || "Reward Campaign",
      adminName: session.user.name || "Admin",
      adminEmail: session.user.email || "Unknown",
      details: [
        { label: "Action Type", value: parseResult.data.actionType },
        { label: "Reward Type", value: parseResult.data.rewardType },
        {
          label: "Reward Value",
          value:
            parseResult.data.rewardType === "BITEHUB_COINS"
              ? `${(parseResult.data.rewardValueInKobo || 0) / 100} Coins`
              : "Free Meal",
        },
        {
          label: "Max Per User",
          value: `${parseResult.data.maxCompletionsPerUser}`,
        },
        { label: "Active", value: parseResult.data.isActive ? "Yes" : "No" },
      ],
      dashboardPath: "/admin/campaigns",
    }).catch((err) =>
      console.error("Failed to send reward campaign update alert email:", err)
    )

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

    const parsedParams = idParamSchema.safeParse(await props.params)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid campaign ID", details: parsedParams.error.flatten() },
        { status: 400 }
      )
    }
    const { id } = parsedParams.data

    await dbConnect()
    const updatedCampaign = await deactivateAdminCampaign(id)

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    sendRewardSystemSecurityAlertEmail({
      action: "Reward Campaign Deactivated",
      entityTitle: updatedCampaign.title || "Reward Campaign",
      adminName: session.user.name || "Admin",
      adminEmail: session.user.email || "Unknown",
      details: [{ label: "Status", value: "Deactivated" }],
      dashboardPath: "/admin/campaigns",
    }).catch((err) =>
      console.error(
        "Failed to send reward campaign deactivation alert email:",
        err
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/campaigns/[id]]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
