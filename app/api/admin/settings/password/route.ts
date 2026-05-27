import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import AdminUser from "@/models/AdminUser"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sendAdminPasswordChangedEmail } from "@/lib/mail"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "superadmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()

    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = parsed.data

    // Fetch the admin user securely by ID
    const adminUser = await AdminUser.findById(session.user.id)
    if (!adminUser || !adminUser.isActive) {
      return NextResponse.json(
        { error: "Admin user not found or inactive" },
        { status: 404 }
      )
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, adminUser.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect current password" },
        { status: 400 }
      )
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Save
    adminUser.password = hashedPassword
    await adminUser.save()

    // Send security alert email
    if (adminUser.email) {
      // Fire and forget, don't wait for the email to succeed to return response
      sendAdminPasswordChangedEmail(adminUser.email, adminUser.name).catch(
        (err) =>
          console.error("Failed to send admin password change email:", err)
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("[POST /api/admin/settings/password]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
