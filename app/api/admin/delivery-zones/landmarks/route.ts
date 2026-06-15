import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Landmark from "@/models/Landmark"
import SubLandmark from "@/models/SubLandmark"
import { auth } from "@/auth"
import { adminLandmarkSchema } from "@/lib/schemas"
import {
  serializeLandmark,
  serializeSubLandmark,
  LeanLandmark,
  LeanSubLandmark,
} from "@/lib/serializers"

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
      const subLms = subLandmarks.filter(
        (sub) => String(sub.landmarkId) === lmId
      )

      return {
        ...serializeLandmark(lm as unknown as LeanLandmark),
        subLandmarks: subLms.map((sub) =>
          serializeSubLandmark(sub as unknown as LeanSubLandmark)
        ),
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

    const parsed = adminLandmarkSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const landmark = await Landmark.create({
      ...parsed.data,
    })

    return NextResponse.json(
      { landmark: serializeLandmark(landmark.toObject()) },
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
