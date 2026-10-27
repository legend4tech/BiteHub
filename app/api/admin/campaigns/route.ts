import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import {
  getAdminCampaigns,
  createAdminCampaign,
} from "@/lib/services/gamificationQueryService"
import { rewardCampaignFormSchema } from "@/lib/schemas/admin"
import { strictRateLimiter } from "@/lib/rate-limit"
import { sendRewardSystemSecurityAlertEmail } from "@/lib/mail"

export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const campaigns = await getAdminCampaigns()

    return NextResponse.json({
      campaigns,
    })
  } catch (error) {
    console.error("[GET /api/admin/campaigns]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
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

    const body = await req.json()
    const parseResult = rewardCampaignFormSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = parseResult.data

    await dbConnect()
    const newCampaign = await createAdminCampaign(data)

    // Trigger security alert email to superadmins
    sendRewardSystemSecurityAlertEmail({
      action: "Reward Campaign Created",
      entityTitle: newCampaign?.title || data.title,
      adminName: session.user.name || "Admin",
      adminEmail: session.user.email || "Unknown",
      details: [
        { label: "Action Type", value: data.actionType },
        { label: "Reward Type", value: data.rewardType },
        {
          label: "Reward Value",
          value:
            data.rewardType === "BITEHUB_COINS"
              ? `${(data.rewardValueInKobo || 0) / 100} Coins`
              : "Free Meal",
        },
        {
          label: "Max Per User",
          value: `${data.maxCompletionsPerUser}`,
        },
        { label: "Active", value: data.isActive ? "Yes" : "No" },
      ],
      dashboardPath: "/admin/campaigns",
    }).catch((err) =>
      console.error("Failed to send reward campaign alert email:", err)
    )

    return NextResponse.json({
      success: true,
      campaign: newCampaign,
    })
  } catch (error) {
    console.error("[POST /api/admin/campaigns]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
