import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import { dismissGamificationFailure } from "@/lib/services/gamificationQueryService"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"
import { failureLogIdParamSchema } from "@/lib/schemas/admin"

export async function PATCH(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  let failureId = ""
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
        `admin_dismiss_failure_${session.user.id}`
      )
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    // 3. Zod validate params
    const rawParams = await props.params
    const paramsResult = failureLogIdParamSchema.safeParse(rawParams)
    if (!paramsResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: paramsResult.error.flatten(),
        },
        { status: 400 }
      )
    }
    const { id } = paramsResult.data
    failureId = id

    // 4. dbConnect
    await dbConnect()

    // 5. Service call
    const result = await dismissGamificationFailure(id)

    // 6. Return response
    return NextResponse.json(result)
  } catch (error) {
    console.error(
      `[PATCH /api/admin/gamification/failures/${failureId}]`,
      error
    )
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to dismiss issue",
      },
      { status: 400 }
    )
  }
}
