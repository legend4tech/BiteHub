import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorFeedback from "@/models/VendorFeedback"
import { auth } from "@/auth"
import { Types } from "mongoose"

export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      session.user?.role !== "vendor" ||
      !session.user?.vendorId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendorId = new Types.ObjectId(session.user.vendorId)

    const feedbacks = await VendorFeedback.find({ vendorId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    // Sanitize anonymous feedback
    const sanitizedFeedbacks = feedbacks.map(
      (f: { isAnonymous: boolean; orderId?: string }) => ({
        ...f,
        orderId: f.isAnonymous ? "Anonymous" : f.orderId,
      })
    )

    return NextResponse.json(sanitizedFeedbacks)
  } catch (error) {
    console.error("[vendor/feedback]", error)
    return NextResponse.json(
      { error: "Failed to load feedback" },
      { status: 500 }
    )
  }
}
