import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import SubLandmark from "@/models/SubLandmark"
import { auth } from "@/auth"
import { adminSubLandmarkSchema } from "@/lib/schemas"
import { serializeSubLandmark } from "@/lib/serializers"

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

    const parsed = adminSubLandmarkSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const subLandmark = await SubLandmark.create({
      ...parsed.data,
    })

    return NextResponse.json(
      {
        subLandmark: serializeSubLandmark(subLandmark.toObject()),
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
