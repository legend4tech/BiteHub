import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import CustomerModel from "@/models/Customer"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    if (!token || !email) {
      return NextResponse.json(
        { message: "Missing token or email" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Re-hash the token received from the URL
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const user = await CustomerModel.findOne({
      pendingEmail: email.toLowerCase(),
      emailChangeToken: hashedToken,
      emailChangeExpires: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json(
        { message: "Verification link is invalid or has expired." },
        { status: 400 }
      )
    }

    // Update email and clear pending fields
    user.email = user.pendingEmail
    user.pendingEmail = undefined
    user.emailChangeToken = undefined
    user.emailChangeExpires = undefined

    await user.save()

    return NextResponse.json({
      message: "Email updated successfully.",
    })
  } catch (error) {
    console.error("[confirm-email GET]", error)
    return NextResponse.json(
      { message: "Internal server error occurred." },
      { status: 500 }
    )
  }
}
