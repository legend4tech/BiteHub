import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorUserModel from "@/models/VendorUser"
import VendorModel from "@/models/Vendor"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import { auth } from "@/auth"

// POST — create a login account for an existing vendor that doesn't have one
export async function POST(
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

    // Ensure vendor exists
    const vendor = await VendorModel.findById(id)
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Ensure no account already exists
    const existing = await VendorUserModel.findOne({ vendorId: id })
    if (existing) {
      return NextResponse.json(
        { error: "This vendor already has a login account" },
        { status: 409 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      )
    }

    // Check email uniqueness
    const emailTaken = await VendorUserModel.findOne({
      email: email.toLowerCase().trim(),
    })
    if (emailTaken) {
      return NextResponse.json(
        { error: "This email is already in use" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await VendorUserModel.create({
      vendorId: id,
      email: email.toLowerCase().trim(),
      password: passwordHash,
      role: "vendor",
      isActive: true,
    })

    return NextResponse.json(
      { message: "Login account created successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("[admin/vendors/[id]/account POST]", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}
