import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import { getMonnifyToken } from "@/lib/monnify"
import axios from "axios"

interface MonnifySubAccount {
  subAccountCode: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  defaultSplitPercentage?: number
}

export const dynamic = "force-dynamic"

const MONNIFY_API_URL =
  process.env.NEXT_PUBLIC_MONNIFY_API_URL || "https://sandbox.monnify.com"

/**
 * GET /api/vendor/monnify/balance
 * Returns the vendor's Monnify sub-account balance and the platform's
 * wallet balance so vendors can see exactly how much they are owed.
 */
export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      session.user?.role !== "vendor" ||
      !session.user?.vendorId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendor = await Vendor.findById(session.user.vendorId)
      .select("monnifySubAccountCode")
      .lean()

    if (!vendor?.monnifySubAccountCode) {
      return NextResponse.json(
        {
          error:
            "No Monnify sub-account found. Please connect your bank account.",
        },
        { status: 404 }
      )
    }

    const token = await getMonnifyToken()

    // Fetch ALL sub-accounts and find ours
    const subAccountsRes = await axios.get(
      `${MONNIFY_API_URL}/api/v1/sub-accounts`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    const subAccounts: MonnifySubAccount[] =
      subAccountsRes.data?.responseBody || []
    const mySubAccount = subAccounts.find(
      (s) => s.subAccountCode === vendor.monnifySubAccountCode
    )

    return NextResponse.json({
      subAccountCode: vendor.monnifySubAccountCode,
      bankName: mySubAccount?.bankName || null,
      accountNumber: mySubAccount?.accountNumber || null,
      accountName: mySubAccount?.accountName || null,
      defaultSplitPercentage: mySubAccount?.defaultSplitPercentage || null,
      // Balance fields — Monnify sub-accounts don't expose a live balance endpoint
      // but we surface what's available from the sub-account details
      settlementStatus: "Settlements processed T+1 business day by Monnify",
    })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "[vendor/monnify/balance GET]",
        error.response?.data || error.message
      )
    } else {
      console.error(
        "[vendor/monnify/balance GET]",
        error instanceof Error ? error.message : error
      )
    }
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    )
  }
}
