import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import VendorUser from "@/models/VendorUser"
import { CURRENT_TERMS_VERSION } from "@/lib/constants"

export async function POST() {
  try {
    const session = await auth()

    if (!session || !session.user || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Find the vendor user by email
    const vendorUser = await VendorUser.findOne({ email: session.user.email })
    if (!vendorUser) {
      return NextResponse.json(
        { error: "Vendor user not found" },
        { status: 404 }
      )
    }

    vendorUser.acceptedTermsVersion = CURRENT_TERMS_VERSION
    vendorUser.acceptedTermsAt = new Date()
    await vendorUser.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/vendor/accept-terms]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
