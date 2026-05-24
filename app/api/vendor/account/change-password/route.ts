import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import VendorUserModel from "@/models/VendorUser"
import VendorModel from "@/models/Vendor"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { strongPasswordSchema } from "@/lib/schemas"
import { Resend } from "resend"
import React from "react"
import PasswordChangeNotification from "@/emails/PasswordChangeNotification"

const resend = new Resend(process.env.RESEND_API_KEY)

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "vendor" || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = changePasswordSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input"
      return NextResponse.json({ message: firstError }, { status: 400 })
    }

    const { currentPassword, newPassword } = parsed.data

    await dbConnect()

    const user = await VendorUserModel.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return NextResponse.json(
        { message: "Incorrect current password" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    user.password = passwordHash
    user.lastPasswordChangeAt = new Date()
    await user.save()

    // Send security notification email
    if (process.env.RESEND_API_KEY) {
      try {
        const vendorId = session.user?.vendorId || user.vendorId
        const vendor = vendorId
          ? await VendorModel.findById(vendorId).lean()
          : null
        const vendorName = vendor?.name || "Vendor"
        const fromEmail =
          process.env.EMAIL_FROM || "BiteHub <no-reply@mail.bitehubapp.com>"

        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: "Security Alert: Your password has been changed",
          react: React.createElement(PasswordChangeNotification, {
            vendorName,
          }),
        })
      } catch (emailError) {
        console.error(
          "[change-password] Failed to send notification email:",
          emailError
        )
      }
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("[change-password POST]", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
