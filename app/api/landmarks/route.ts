import { NextResponse } from "next/server"
import { getLandmarksQuerySchema } from "@/lib/schemas"
import { getLandmarksWithSubs } from "@/lib/services/landmarkService"

// ── GET /api/landmarks ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // 1. Parse + validate query params
    const { searchParams } = new URL(request.url)
    const query = {
      school: searchParams.get("school"),
      campus: searchParams.get("campus"),
    }
    const parsed = getLandmarksQuerySchema.safeParse(query)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.format() },
        { status: 400 }
      )
    }

    // 2. Auth check (Public route, none needed)

    // 3. Call service (which handles dbConnect and logic)
    // 4. Serialize result (handled by service)
    const data = await getLandmarksWithSubs({
      school: parsed.data.school,
      campus: parsed.data.campus,
    })

    // 5. Return response
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/landmarks]", error)
    return NextResponse.json(
      { error: "Failed to fetch landmarks" },
      { status: 500 }
    )
  }
}
