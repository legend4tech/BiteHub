import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import PlatformWithdrawal from "@/models/PlatformWithdrawal"
import { withdrawalSchema } from "@/lib/schemas/admin"
import { serializePlatformWithdrawal } from "@/lib/serializers"

// GET — list all withdrawals
export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const withdrawals = await PlatformWithdrawal.find({})
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      withdrawals: withdrawals.map(serializePlatformWithdrawal),
    })
  } catch (error) {
    console.error("[admin/withdrawals GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    )
  }
}

// POST — log a new withdrawal
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = withdrawalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    await dbConnect()

    const withdrawal = await PlatformWithdrawal.create({
      ...parsed.data,
      withdrawnBy: session.user?.email ?? "unknown",
    })

    return NextResponse.json(
      { withdrawal: serializePlatformWithdrawal(withdrawal.toObject()) },
      { status: 201 }
    )
  } catch (error) {
    console.error("[admin/withdrawals POST]", error)
    return NextResponse.json(
      { error: "Failed to log withdrawal" },
      { status: 500 }
    )
  }
}
