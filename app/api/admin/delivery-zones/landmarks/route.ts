import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Landmark from "@/models/Landmark"
import SubLandmark from "@/models/SubLandmark"
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
    const landmarks = await Landmark.find()
      .sort({ school: 1, campus: 1, name: 1 })
      .lean()
    const subLandmarks = await SubLandmark.find().sort({ name: 1 }).lean()

    const result = landmarks.map((lm) => {
      const lmId = String(lm._id)
      return {
        ...lm,
        id: lmId,
        subLandmarks: subLandmarks
          .filter((sub) => String(sub.landmarkId) === lmId)
          .map((sub) => ({ ...sub, id: String(sub._id) })),
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[admin/landmarks GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch landmarks" },
      { status: 500 }
    )
  }
}

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

    if (
      !data.name ||
      !data.school ||
      !data.campus ||
      data.defaultDeliveryFee === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const landmark = await Landmark.create({
      name: data.name.trim(),
      school: data.school.trim(),
      campus: data.campus.trim(),
      defaultDeliveryFee: Number(data.defaultDeliveryFee),
      isActive: data.isActive ?? true,
    })

    return NextResponse.json(
      { landmark: { ...landmark.toObject(), id: String(landmark._id) } },
      { status: 201 }
    )
  } catch (error) {
    console.error("[admin/landmarks POST]", error)
    return NextResponse.json(
      { error: "Failed to create landmark" },
      { status: 500 }
    )
  }
}
