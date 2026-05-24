import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import PlatformFeedback from "@/models/PlatformFeedback"
import { auth } from "@/auth"

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

    const feedbacks = await PlatformFeedback.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error("[admin/feedback]", error)
    return NextResponse.json(
      { error: "Failed to load feedback" },
      { status: 500 }
    )
  }
}
