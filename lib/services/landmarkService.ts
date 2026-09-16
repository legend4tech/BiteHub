/**
 * landmarkService.ts
 *
 * Owns system landmark and sub-landmark fetching for public/customer usage.
 * Used by /api/landmarks (React Query).
 */

import dbConnect from "@/lib/db"
import Landmark from "@/models/Landmark"
import SubLandmark from "@/models/SubLandmark"
import { serializeLandmark, serializeSubLandmark } from "@/lib/serializers"

export interface GetLandmarksOptions {
  school: string
  campus: string
}

export type SerializedLandmarkWithSubs = ReturnType<
  typeof serializeLandmark
> & {
  subLandmarks: ReturnType<typeof serializeSubLandmark>[]
}

export async function getLandmarksWithSubs(
  options: GetLandmarksOptions
): Promise<SerializedLandmarkWithSubs[]> {
  await dbConnect()
  const { school, campus } = options

  const landmarks = await Landmark.find({
    school,
    campus,
    isActive: true,
  })
    .sort({ name: 1 })
    .lean()

  const landmarkIds = landmarks.map((l) => l._id)

  const subLandmarks = await SubLandmark.find({
    landmarkId: { $in: landmarkIds },
    isActive: true,
  })
    .sort({ name: 1 })
    .lean()

  const formattedLandmarks = landmarks.map((l) => {
    const subs = subLandmarks.filter(
      (sub) => sub.landmarkId.toString() === l._id.toString()
    )
    return {
      ...serializeLandmark(l),
      subLandmarks: subs.map(serializeSubLandmark),
    }
  })

  return formattedLandmarks as SerializedLandmarkWithSubs[]
}
