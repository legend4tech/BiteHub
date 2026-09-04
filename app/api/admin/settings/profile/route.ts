import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import AdminUserModel from "@/models/AdminUser"
import { auth } from "@/auth"
import { updateAdminProfileSchema } from "@/lib/schemas"

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin", "vendor_manager"].includes(
        session.user?.role || ""
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateAdminProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    await dbConnect()

    const updatedUser = await AdminUserModel.findByIdAndUpdate(
      session.user.id,
      { name: parsed.data.name.trim() },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("[admin/settings/profile PATCH]", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
