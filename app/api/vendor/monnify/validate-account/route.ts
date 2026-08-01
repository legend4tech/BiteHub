import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { validateMonnifyBankAccount } from "@/lib/monnify"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountNumber = searchParams.get("accountNumber")
    const bankCode = searchParams.get("bankCode")

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "Account number and bank code are required" },
        { status: 400 }
      )
    }

    const accountDetails = await validateMonnifyBankAccount(
      accountNumber,
      bankCode
    )

    return NextResponse.json({ success: true, accountDetails })
  } catch (error: unknown) {
    console.error("[GET /api/vendor/monnify/validate-account]", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    const status = message === "Invalid bank account details" ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
