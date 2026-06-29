import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import VendorUserModel from "@/models/VendorUser"
import VendorModel from "@/models/Vendor"
import { sendPasswordResetEmail } from "@/lib/mail"
import { forgotPasswordSchema } from "@/lib/schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    await dbConnect()

    const user = await VendorUserModel.findOne({ email: email.toLowerCase() })

    // For security, always return success to prevent email harvesting.
    if (!user || !user.isActive) {
      return NextResponse.json({
        message:
          "If an account matches that email, a password reset link has been sent.",
      })
    }

    const rawToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex")

    const expiryMinutes = parseInt(
      process.env.PASSWORD_RESET_EXPIRY_MINUTES || "15",
      10
    )

    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = new Date(Date.now() + expiryMinutes * 60 * 1000)
    await user.save()

    // Fetch vendor name for email branding
    const vendor = (await VendorModel.findById(user.vendorId)
      .select("name")
      .lean()) as { name: string } | null
    const vendorName = vendor ? vendor.name : "Vendor"

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetLink = `${baseUrl}/vendor/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`

    await sendPasswordResetEmail(
      user.email,
      vendorName,
      resetLink,
      expiryMinutes
    )

    return NextResponse.json({
      message:
        "If an account matches that email, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("Forgot password API error:", error)
    return NextResponse.json(
      { message: "Internal server error occurred." },
      { status: 500 }
    )
  }
}
