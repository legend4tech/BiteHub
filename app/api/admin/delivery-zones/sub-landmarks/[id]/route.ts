import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
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

    // Handle clearing the defaultDeliveryFeeInKobo if passed as empty string or null
    const updated = await SubLandmark.findByIdAndUpdate(
      id,
      data.defaultDeliveryFeeInKobo === null ||
        data.defaultDeliveryFeeInKobo === ""
        ? {
            $set: { name: data.name?.trim(), isActive: data.isActive },
            $unset: { defaultDeliveryFeeInKobo: 1 },
          }
        : {
            $set: {
              name: data.name?.trim(),
              isActive: data.isActive,
              ...(data.defaultDeliveryFeeInKobo !== undefined
                ? {
                    defaultDeliveryFeeInKobo: Number(
                      data.defaultDeliveryFeeInKobo
                    ),
                  }
                : {}),
            },
          },
      { new: true, runValidators: true }
    )

    if (!updated) {
      return NextResponse.json(
        { error: "Sub-Landmark not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { subLandmark: { ...updated.toObject(), id: String(updated._id) } },
      { status: 200 }
    )
  } catch (error) {
    console.error("[admin/sub-landmarks PUT]", error)
    return NextResponse.json(
      { error: "Failed to update sub-landmark" },
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

    await SubLandmark.findByIdAndDelete(id)

    return NextResponse.json(
      { message: "Sub-Landmark deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[admin/sub-landmarks DELETE]", error)
    return NextResponse.json(
      { error: "Failed to delete sub-landmark" },
      { status: 500 }
    )
  }
}
