import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import {
  getAdminCampaigns,
  createAdminCampaign,
} from "@/lib/services/gamificationService"
import { rewardCampaignFormSchema } from "@/lib/schemas/admin"
import { strictRateLimiter } from "@/lib/rate-limit"

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
