import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Landmark from "@/models/Landmark"
import SubLandmark from "@/models/SubLandmark"
import { auth } from "@/auth"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    const updated = await Landmark.findByIdAndUpdate(
      id,
      {
        $set: {
          name: data.name?.trim(),
          school: data.school?.trim(),
          campus: data.campus?.trim(),
          defaultDeliveryFeeInKobo:
            data.defaultDeliveryFeeInKobo !== undefined
              ? Number(data.defaultDeliveryFeeInKobo)
              : undefined,
          isActive: data.isActive,
        },
      },
      { new: true, runValidators: true }
    )

    if (!updated) {
      return NextResponse.json({ error: "Landmark not found" }, { status: 404 })
    }

    return NextResponse.json(
      { landmark: { ...updated.toObject(), id: String(updated._id) } },
      { status: 200 }
    )
  } catch (error) {
    console.error("[admin/landmarks PUT]", error)
    return NextResponse.json(
      { error: "Failed to update landmark" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const { id } = await params

    // Delete the landmark and all its sub-landmarks
    await Landmark.findByIdAndDelete(id)
    await SubLandmark.deleteMany({ landmarkId: id })

    return NextResponse.json(
      { message: "Landmark deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[admin/landmarks DELETE]", error)
    return NextResponse.json(
      { error: "Failed to delete landmark" },
      { status: 500 }
    )
  }
}
