import { NextResponse } from "next/server"
import crypto from "crypto"
import { processWalletDisbursements } from "@/lib/services/payoutService"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error(
        "[GET /api/cron/disburse-funds] Missing CRON_SECRET env variable"
      )
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")
    const expectedHeader = `Bearer ${cronSecret}`
    if (
      !authHeader ||
      authHeader.length !== expectedHeader.length ||
      !crypto.timingSafeEqual(
        Buffer.from(authHeader),
        Buffer.from(expectedHeader)
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await processWalletDisbursements()
    if (result.processed === 0) {
      return NextResponse.json(result)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/cron/disburse-funds]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
