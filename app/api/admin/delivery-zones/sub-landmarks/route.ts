import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import SubLandmark from "@/models/SubLandmark"
import { auth } from "@/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const data = await request.json()

    if (!data.name || !data.landmarkId) {
      return NextResponse.json(
        { error: "Name and Landmark ID are required" },
        { status: 400 }
      )
    }

    const subLandmark = await SubLandmark.create({
      name: data.name.trim(),
      landmarkId: data.landmarkId,
      defaultDeliveryFee:
        data.defaultDeliveryFee !== undefined && data.defaultDeliveryFee !== ""
          ? Number(data.defaultDeliveryFee)
          : undefined,
      isActive: data.isActive ?? true,
    })

    return NextResponse.json(
      {
        subLandmark: {
          ...subLandmark.toObject(),
          id: String(subLandmark._id),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[admin/sub-landmarks POST]", error)
    return NextResponse.json(
      { error: "Failed to create sub-landmark" },
      { status: 500 }
    )
  }
}
