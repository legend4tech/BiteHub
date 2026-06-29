import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import VendorUserModel from "@/models/VendorUser"
import { z } from "zod"
import crypto from "crypto"
import { Resend } from "resend"
import React from "react"
import EmailChangeNotification from "@/emails/EmailChangeNotification"
import EmailChangeConfirmation from "@/emails/EmailChangeConfirmation"
import VendorModel from "@/models/Vendor"

const resend = new Resend(process.env.RESEND_API_KEY)

import { changeEmailSchema } from "@/lib/schemas"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (
      !session ||
      session.user?.role !== "vendor" ||
      !session.user?.email ||
      !session.user?.vendorId
    ) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = changeEmailSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input"
      return NextResponse.json({ message: firstError }, { status: 400 })
    }

    const { newEmail } = parsed.data
    const currentEmail = session.user.email.toLowerCase()

    if (newEmail === currentEmail) {
      return NextResponse.json(
        { message: "This is already your current email address" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Check if new email is already in use by any user
    const existingUser = await VendorUserModel.findOne({ email: newEmail })
    if (existingUser) {
      return NextResponse.json(
        { message: "This email address is already in use by another account" },
        { status: 400 }
      )
    }

    const user = await VendorUserModel.findOne({ email: currentEmail })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const vendor = await VendorModel.findById(session.user.vendorId).lean()
    const vendorName = vendor?.name || "Vendor"

    // Generate token
    const rawToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex")

    if (!process.env.EMAIL_TOKEN_EXPIRY_MINUTES) {
      console.error(
        "EMAIL_TOKEN_EXPIRY_MINUTES is not configured in environment variables."
      )
      return NextResponse.json(
        { message: "Server misconfiguration. Please contact support." },
        { status: 500 }
      )
    }
    const expiryMinutes = parseInt(process.env.EMAIL_TOKEN_EXPIRY_MINUTES, 10)

    // Save to DB
    user.pendingEmail = newEmail
    user.emailChangeToken = hashedToken
    user.emailChangeExpires = new Date(Date.now() + expiryMinutes * 60 * 1000)
    await user.save()

    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️ RESEND_API_KEY not set. Email change link not sent.")
      return NextResponse.json(
        { message: "Email service not configured." },
        { status: 503 }
      )
    }

    const fromEmail =
      process.env.EMAIL_FROM || "BiteHub <no-reply@mail.bitehubapp.com>"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const confirmLink = `${appUrl}/vendor/confirm-email?token=${rawToken}&email=${encodeURIComponent(newEmail)}`

    // Send both emails
    const [notifyResult, confirmResult] = await Promise.allSettled([
      // 1. Notify OLD email
      resend.emails.send({
        from: fromEmail,
        to: currentEmail,
        subject: "Security Alert: Email change requested",
        react: React.createElement(EmailChangeNotification, {
          vendorName,
        }),
      }),
      // 2. Send confirmation to NEW email
      resend.emails.send({
        from: fromEmail,
        to: newEmail,
        subject: "Confirm your new BiteHub email address",
        react: React.createElement(EmailChangeConfirmation, {
          vendorName,
          confirmLink,
          expiryMinutes,
        }),
      }),
    ])

    if (
      confirmResult.status === "rejected" ||
      (confirmResult.status === "fulfilled" && confirmResult.value?.error)
    ) {
      console.error(
        "[change-email] Failed to send confirmation email:",
        confirmResult.status === "rejected"
          ? confirmResult.reason
          : confirmResult.value.error
      )
      return NextResponse.json(
        { message: "Failed to send confirmation email. Please try again." },
        { status: 500 }
      )
    }

    if (
      notifyResult.status === "rejected" ||
      (notifyResult.status === "fulfilled" && notifyResult.value?.error)
    ) {
      console.warn(
        "[change-email] Failed to send notification to old email:",
        notifyResult.status === "rejected"
          ? notifyResult.reason
          : notifyResult.value.error
      )
    }

    return NextResponse.json({
      message: "Confirmation link sent to your new email address.",
    })
  } catch (error) {
    console.error("[change-email POST]", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
