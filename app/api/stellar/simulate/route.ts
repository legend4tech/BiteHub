import { NextRequest, NextResponse } from "next/server"
import { stellarSimulateRequestSchema } from "@/lib/schemas/stellar"
import { executeSimulatedSponsorPayment } from "@/lib/stellar/stellarTestnet"

export async function POST(req: NextRequest) {
  try {
    if (
      process.env.NEXT_PUBLIC_ENABLE_STELLAR_DEMO !== "true" &&
      process.env.NODE_ENV === "production"
    ) {
      return NextResponse.json(
        { success: false, message: "Stellar demo simulation is disabled" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = stellarSimulateRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid simulation request",
          errors: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    const { destinationAddress, memo, amount } = parsed.data
    const result = await executeSimulatedSponsorPayment(
      destinationAddress,
      memo,
      amount
    )

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error("Stellar simulate error:", error)
    const errMessage =
      error instanceof Error ? error.message : "Failed to simulate transaction"
    return NextResponse.json(
      { success: false, message: errMessage },
      { status: 500 }
    )
  }
}
