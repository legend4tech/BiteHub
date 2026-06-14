import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Landmark from "@/models/Landmark"
import SubLandmark from "@/models/SubLandmark"
import Vendor from "@/models/Vendor"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect()
    const { slug } = await params

    const vendor = await Vendor.findById(slug).lean()
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // 1. Fetch Admin Landmarks and SubLandmarks for the vendor's campus
    // Using case-insensitive regex to handle "coou" vs "COOU"
    const landmarks = await Landmark.find({
      school: { $regex: new RegExp(`^${vendor.school}$`, "i") },
      campus: { $regex: new RegExp(`^${vendor.campus}$`, "i") },
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

    // 2. Prepare Maps for fast lookup of vendor overrides
    const vendorLandmarkOverrides = new Map<string, number>()
    vendor.landmarkOverrides?.forEach(
      (override: { landmarkId: string; fee: number }) => {
        vendorLandmarkOverrides.set(String(override.landmarkId), override.fee)
      }
    )

    const vendorSubLandmarkOverrides = new Map<string, number>()
    vendor.subLandmarkOverrides?.forEach(
      (override: { subLandmarkId: string; fee: number }) => {
        vendorSubLandmarkOverrides.set(
          String(override.subLandmarkId),
          override.fee
        )
      }
    )

    // 3. Price Resolution Engine (Backend Computation)
    const result = landmarks.map((lm) => {
      const lmId = String(lm._id)

      // Resolve Main Landmark Fee
      // Priority 1: Vendor Override for Landmark
      // Priority 2: Admin Default for Landmark
      const resolvedLandmarkFee = vendorLandmarkOverrides.has(lmId)
        ? vendorLandmarkOverrides.get(lmId)!
        : lm.defaultDeliveryFee

      // Get and Resolve SubLandmarks
      const lmSubs = subLandmarks
        .filter((sub) => String(sub.landmarkId) === lmId)
        .map((sub) => {
          const subId = String(sub._id)

          // Resolve SubLandmark Fee
          // Priority 1: Vendor Override for SubLandmark
          // Priority 2: Vendor Override for Landmark (resolvedLandmarkFee)
          // Priority 3: Admin Default for SubLandmark
          // Priority 4: Admin Default for Landmark
          let resolvedSubFee = resolvedLandmarkFee // Fallback to the resolved main landmark fee

          if (vendorSubLandmarkOverrides.has(subId)) {
            // Vendor has explicit override for this sub-landmark
            resolvedSubFee = vendorSubLandmarkOverrides.get(subId)!
          } else if (
            sub.defaultDeliveryFee !== undefined &&
            sub.defaultDeliveryFee !== null &&
            !vendorLandmarkOverrides.has(lmId)
          ) {
            // Admin has explicit override for this sub-landmark AND vendor didn't override the main landmark
            // (If vendor overrode main landmark, it overrides Admin's sub-landmark specific fee too to avoid confusion,
            // but if they want a different fee, they should override the sub-landmark directly).
            resolvedSubFee = sub.defaultDeliveryFee
          }

          return {
            id: subId,
            name: sub.name,
            fee: resolvedSubFee,
          }
        })

      return {
        id: lmId,
        name: lm.name,
        fee: resolvedLandmarkFee,
        subLandmarks: lmSubs,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[vendors/delivery-zones GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch delivery zones" },
      { status: 500 }
    )
  }
}
