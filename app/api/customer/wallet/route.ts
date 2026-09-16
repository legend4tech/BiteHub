import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  getCustomerByEmail,
  getCustomerWalletData,
} from "@/lib/services/customerService"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const customer = await getCustomerByEmail(session.user.email)
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const { wallet, transactions } = await getCustomerWalletData(
      customer._id.toString()
    )

    return NextResponse.json({
      wallet,
      transactions,
    })
  } catch (error) {
    console.error("[CUSTOMER_WALLET_GET]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
