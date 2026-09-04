import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import AdminUserModel from "@/models/AdminUser"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { createStaffSchema } from "@/lib/schemas"

// GET — List all staff
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

    // Exclude superadmins from the general list, only show admins and vendor managers
    const staff = await AdminUserModel.find({ role: { $ne: "superadmin" } })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(staff)
  } catch (error) {
    console.error("[admin/staff GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    )
  }
}

// POST — Create a new staff member (vendor_manager or admin)
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createStaffSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, role } = parsed.data

    // Only superadmin can create other admins. Admin can only create vendor_managers.
    if (role === "admin" && session.user?.role !== "superadmin") {
      return NextResponse.json(
        { error: "Only superadmins can create admin accounts" },
        { status: 403 }
      )
    }

    await dbConnect()

    const existingUser = await AdminUserModel.findOne({
      email: email.toLowerCase(),
    })
    if (existingUser) {
      return NextResponse.json(
        { error: "A staff account with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const newStaff = await AdminUserModel.create({
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role,
      isActive: true,
    })

    return NextResponse.json(
      { message: "Staff created successfully", id: newStaff._id },
      { status: 201 }
    )
  } catch (error) {
    console.error("[admin/staff POST]", error)
    return NextResponse.json(
      { error: "Failed to create staff account" },
      { status: 500 }
    )
  }
}
