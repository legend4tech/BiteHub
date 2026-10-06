import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import { getCustomerCampaignProgress } from "@/lib/services/gamificationQueryService"

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const result = await getCustomerCampaignProgress(session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/customer/gamification/progress]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
