import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import AdminUser from "@/models/AdminUser"
import { auth } from "@/auth"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"
import { ADMIN_OTP_EXPIRY_MINUTES } from "@/lib/constants"
import { sendAdminPlatformFeeOtpEmail } from "@/lib/mail"

export async function POST() {
  try {
    const session = await auth()
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "superadmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate-limit OTP generation requests to prevent email bombing & flooding
    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(
        `admin_fee_otp_${session.user.id}`
      )
      if (!success) {
        return NextResponse.json(
          {
            error:
              "Too many verification requests. Please wait a few minutes before trying again.",
          },
          { status: 429 }
        )
      }
    }

    await dbConnect()
    const adminUser = await AdminUser.findById(session.user.id)
    if (!adminUser || !adminUser.isActive) {
      return NextResponse.json(
        { error: "Admin user not found or inactive" },
        { status: 404 }
      )
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString()
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

    adminUser.platformFeeUpdateOtpHash = otpHash
    adminUser.platformFeeUpdateOtpExpires = new Date(
      Date.now() + ADMIN_OTP_EXPIRY_MINUTES * 60 * 1000
    )
    adminUser.platformFeeUpdateOtpAttempts = 0
    await adminUser.save()

    // Send email with the OTP code
    sendAdminPlatformFeeOtpEmail(
      adminUser.email,
      adminUser.name,
      otp,
      ADMIN_OTP_EXPIRY_MINUTES
    ).catch((err) =>
      console.error("Failed to send admin platform fee OTP email:", err)
    )

    return NextResponse.json({
      success: true,
      message: "Security verification code sent to your registered email.",
      expiresInMinutes: ADMIN_OTP_EXPIRY_MINUTES,
    })
  } catch (error) {
    console.error("[POST /api/admin/settings/global/request-otp]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
