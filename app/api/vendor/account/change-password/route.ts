import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import VendorUserModel from "@/models/VendorUser"
import VendorModel from "@/models/Vendor"
import bcrypt from "bcryptjs"
import { changePasswordSchema } from "@/lib/schemas"
import { Resend } from "resend"
import React from "react"
import PasswordChangeNotification from "@/emails/PasswordChangeNotification"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "vendor" || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Rate-limit by user ID — prevents brute-forcing current password via this endpoint
    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(
        `vendor_change_password_${session.user.id}`
      )
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
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
