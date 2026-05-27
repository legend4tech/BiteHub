import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import VendorUser from "@/models/VendorUser"
import { CURRENT_TERMS_VERSION } from "@/lib/constants"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const session = await auth()

    if (!session || !session.user || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    if (!session.user.email) {
      return NextResponse.json(
        { error: "Email not found in session" },
        { status: 400 }
      )
    }

    const email = session.user.email.toLowerCase()

    // Bypasses schema compilation/caching issues using raw MongoDB update
    const result = await VendorUser.findOneAndUpdate(
      { email },
      {
        $set: {
          acceptedTermsVersion: CURRENT_TERMS_VERSION,
          acceptedTermsAt: new Date(),
        },
      },
      { new: true, lean: true }
    )

    if (!result) {
      return NextResponse.json(
        { error: "Vendor user not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/vendor/accept-terms]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
