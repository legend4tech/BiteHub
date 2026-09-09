import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Landmark from "@/models/Landmark"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const school = searchParams.get("school")
    const campus = searchParams.get("campus")

    if (!school || !campus) {
      return NextResponse.json(
        { error: "School and campus are required" },
        { status: 400 }
      )
    }

    await dbConnect()

    const landmarks = await Landmark.find({
      school,
      campus,
      isActive: true,
    })
      .sort({ name: 1 })
      .lean()

    return NextResponse.json(landmarks)
  } catch (error) {
    console.error("Error fetching landmarks:", error)
    return NextResponse.json(
      { error: "Failed to fetch landmarks" },
      { status: 500 }
    )
  }
}
