import { NextResponse } from "next/server"
import { processWalletDisbursements } from "@/lib/services/payoutService"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Secure the cron endpoint. Vercel automatically sends this header.
    // Make sure you have CRON_SECRET configured in your Vercel Environment Variables.
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
