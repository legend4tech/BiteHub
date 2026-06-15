import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import VendorUserModel from "@/models/VendorUser"
import mongoose from "mongoose"
import { auth } from "@/auth"

// PATCH — toggle vendor isActive or update fields
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const { id } = await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    const body = await request.json()
    const { isActive, accountIsActive } = body

    // Toggle vendor storefront
    if (typeof isActive === "boolean") {
      if (isActive) {
        // Enforce payment details requirement before activating
        const vendor = await VendorModel.findById(id).lean()
        const hasPaymentDetails =
          vendor?.monnifyIntegrationStatus === "active" ||
          !!vendor?.monnifySubAccountCode
        if (!hasPaymentDetails) {
          return NextResponse.json(
            {
              error:
                "Vendor must set up their bank details before they can be active.",
            },
            { status: 400 }
          )
        }
      }
      await VendorModel.findByIdAndUpdate(id, { isActive })
    }

    // Toggle vendor login account independently
    if (typeof accountIsActive === "boolean") {
      await VendorUserModel.findOneAndUpdate(
        { vendorId: id },
        { isActive: accountIsActive }
      )
    }

    return NextResponse.json({ message: "Updated successfully" })
  } catch (error) {
    console.error("[admin/vendors PATCH]", error)
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    )
  }
}
