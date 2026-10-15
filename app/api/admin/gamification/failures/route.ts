import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import { getGamificationFailures } from "@/lib/services/gamificationQueryService"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"
import { gamificationFailuresQuerySchema } from "@/lib/schemas/admin"

export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Rate limit
    if (isRateLimitingEnabled && session.user?.id) {
      const { success } = await strictRateLimiter.limit(
        `admin_failures_${session.user.id}`
      )
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    // 3. Zod validate query params
    const url = new URL(request.url)
    const queryResult = gamificationFailuresQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries())
    )
    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: queryResult.error.flatten(),
        },
        { status: 400 }
      )
    }

    const resolved =
      queryResult.data.resolved === "true"
        ? true
        : queryResult.data.resolved === "false"
          ? false
          : undefined

    // 4. dbConnect
    await dbConnect()

    // 5. Service call
    const failures = await getGamificationFailures(resolved)

    // 6. Return response
    return NextResponse.json({ success: true, failures })
  } catch (error) {
    console.error("[GET /api/admin/gamification/failures]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
