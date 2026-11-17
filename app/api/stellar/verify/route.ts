import { NextRequest, NextResponse } from "next/server"
import { checkStellarPaymentOnChain } from "@/lib/stellar/stellarTestnet"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const memo = searchParams.get("memo")

    if (!memo) {
      return NextResponse.json(
        { success: false, message: "Memo query parameter is required" },
        { status: 400 }
      )
    }

    const verification = await checkStellarPaymentOnChain(memo)

    return NextResponse.json({
      success: true,
      ...verification,
    })
  } catch (error: unknown) {
    console.error("Stellar verify error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to verify transaction on-chain" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const memo = body.memo

    if (!memo || typeof memo !== "string") {
      return NextResponse.json(
        { success: false, message: "Valid memo is required" },
        { status: 400 }
      )
    }

    const verification = await checkStellarPaymentOnChain(memo)

    return NextResponse.json({
      success: true,
      ...verification,
    })
  } catch (error: unknown) {
    console.error("Stellar verify POST error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to verify transaction on-chain" },
      { status: 500 }
    )
  }
}
