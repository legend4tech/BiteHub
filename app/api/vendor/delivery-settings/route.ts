import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Landmark from "@/models/Landmark"
import SubLandmark from "@/models/SubLandmark"
import Vendor from "@/models/Vendor"
import { auth } from "@/auth"
import { vendorDeliverySettingsUpdateSchema } from "@/lib/schemas"

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendor = await Vendor.findById(session.user.vendorId).lean()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Fetch landmarks for this vendor's campus
    const landmarks = await Landmark.find({
      school: vendor.school,
      campus: vendor.campus,
      isActive: true,
    })
      .sort({ name: 1 })
      .lean()

    const landmarkIds = landmarks.map((lm) => lm._id)
    const subLandmarks = await SubLandmark.find({
      landmarkId: { $in: landmarkIds },
      isActive: true,
    })
      .sort({ name: 1 })
      .lean()

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

    return NextResponse.json({
      landmarks: result,
      overrides: {
        landmarks: (vendor.landmarkOverrides || []).map(
          (o: { landmarkId: unknown; fee: number }) => ({
            landmarkId: String(o.landmarkId),
            fee: o.fee,
          })
        ),
        subLandmarks: (vendor.subLandmarkOverrides || []).map(
          (o: { subLandmarkId: unknown; fee: number }) => ({
            subLandmarkId: String(o.subLandmarkId),
            fee: o.fee,
          })
        ),
      },
    })
  } catch (error) {
    console.error("[vendor/delivery-settings GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch delivery settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const data = await request.json()

    // Validate payloads
    const parsed = vendorDeliverySettingsUpdateSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { landmarkOverrides, subLandmarkOverrides } = parsed.data

    const updatedVendor = await Vendor.findByIdAndUpdate(
      session.user.vendorId,
      {
        $set: {
          landmarkOverrides,
          subLandmarkOverrides,
        },
      },
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      message: "Settings updated",
      overrides: {
        landmarks: updatedVendor?.landmarkOverrides || [],
        subLandmarks: updatedVendor?.subLandmarkOverrides || [],
      },
    })
  } catch (error) {
    console.error("[vendor/delivery-settings PUT]", error)
    return NextResponse.json(
      { error: "Failed to update delivery settings" },
      { status: 500 }
    )
  }
}
