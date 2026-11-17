import { NextRequest, NextResponse } from "next/server"
import { stellarSessionRequestSchema } from "@/lib/schemas/stellar"
import {
  createStellarDepositSession,
  getLiveUsdcNgnRate,
  MOCK_USDC_NAIRA_RATE,
} from "@/lib/stellar/stellarTestnet"

export async function GET() {
  try {
    const rate = await getLiveUsdcNgnRate()
    return NextResponse.json({
      success: true,
      rate,
    })
  } catch {
    return NextResponse.json({
      success: true,
      rate: MOCK_USDC_NAIRA_RATE,
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = stellarSessionRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid session request",
          errors: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    const liveRate = await getLiveUsdcNgnRate()
    const session = createStellarDepositSession(
      parsed.data.amountInNaira,
      liveRate
    )

    return NextResponse.json({
      success: true,
      session,
    })
  } catch (error) {
    console.error("Stellar session error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create Stellar deposit session" },
      { status: 500 }
    )
  }
}
