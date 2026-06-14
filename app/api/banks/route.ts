import { NextResponse } from "next/server"
import axios from "axios"
import { getMonnifyToken } from "@/lib/monnify"

const MONNIFY_API_URL =
  process.env.NEXT_PUBLIC_MONNIFY_API_URL || "https://sandbox.monnify.com"

export async function GET() {
  try {
    const token = await getMonnifyToken()
    const response = await axios.get(`${MONNIFY_API_URL}/api/v1/banks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.data.requestSuccessful) {
      const banks = response.data.responseBody.map(
        (b: { name: string; code: string }) => ({
          name: b.name,
          code: b.code,
        })
      )
      return NextResponse.json({ status: true, data: banks })
    }

    return NextResponse.json(
      { status: false, message: "Failed to fetch banks from Monnify" },
      { status: 400 }
    )
  } catch (error) {
    console.error("[GET /api/banks]", error)
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
