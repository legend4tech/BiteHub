import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import GlobalSettings from "@/models/GlobalSettings"
import AdminUser from "@/models/AdminUser"
import { auth } from "@/auth"
import { updateGlobalSettingsSchema } from "@/lib/schemas"
import { DEFAULT_PLATFORM_FEE_PERCENTAGE } from "@/lib/constants"

// Helper to get or create the singleton settings document
async function getSettings() {
  let settings = await GlobalSettings.findOne()
  if (!settings) {
    settings = await GlobalSettings.create({
      platformFeePercentage: DEFAULT_PLATFORM_FEE_PERCENTAGE,
      maintenanceMode: process.env.MAINTENANCE_MODE === "true",
      updatedBy: "system",
    })
  }
  return settings
}

export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "superadmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const settings = await getSettings()
    return NextResponse.json({
      platformFeePercentage: settings.platformFeePercentage,
      maintenanceMode: settings.maintenanceMode,
    })
  } catch (error) {
    console.error("[GET /api/admin/settings/global]", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "superadmin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateGlobalSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    await dbConnect()
    const settings = await getSettings()

    // 2FA OTP verification required when changing the platform fee percentage
    if (
      parsed.data.platformFeePercentage !== undefined &&
      parsed.data.platformFeePercentage !== settings.platformFeePercentage
    ) {
      const otp = parsed.data.otp
      if (!otp) {
        return NextResponse.json(
          {
            error: "OTP_REQUIRED",
            message:
              "A 6-digit security verification code is required to change the platform fee.",
          },
          { status: 400 }
        )
      }

      const adminUser = await AdminUser.findById(session.user.id)
      if (!adminUser || !adminUser.isActive) {
        return NextResponse.json(
          { error: "Admin user not found or inactive" },
          { status: 404 }
        )
      }

      if ((adminUser.platformFeeUpdateOtpAttempts || 0) >= 5) {
        return NextResponse.json(
          {
            error:
              "Maximum verification attempts exceeded. Please request a new security code.",
          },
          { status: 429 }
        )
      }

      if (
        !adminUser.platformFeeUpdateOtpHash ||
        !adminUser.platformFeeUpdateOtpExpires ||
        new Date() > new Date(adminUser.platformFeeUpdateOtpExpires)
      ) {
        return NextResponse.json(
          {
            error:
              "Security verification code has expired. Please request a new code.",
          },
          { status: 400 }
        )
      }

      const candidateHash = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex")

      const isMatch =
        candidateHash.length === adminUser.platformFeeUpdateOtpHash.length &&
        crypto.timingSafeEqual(
          Buffer.from(candidateHash, "hex"),
          Buffer.from(adminUser.platformFeeUpdateOtpHash, "hex")
        )

      if (!isMatch) {
        adminUser.platformFeeUpdateOtpAttempts =
          (adminUser.platformFeeUpdateOtpAttempts || 0) + 1
        await adminUser.save()
        return NextResponse.json(
          {
            error:
              "Invalid verification code. Please check your email and try again.",
          },
          { status: 400 }
        )
      }

      // Clear OTP on successful validation
      adminUser.platformFeeUpdateOtpHash = undefined
      adminUser.platformFeeUpdateOtpExpires = undefined
      adminUser.platformFeeUpdateOtpAttempts = 0
      await adminUser.save()

      settings.platformFeePercentage = parsed.data.platformFeePercentage
    }

    if (parsed.data.maintenanceMode !== undefined) {
      settings.maintenanceMode = parsed.data.maintenanceMode
    }

    settings.updatedBy = session.user.email || "admin"
    await settings.save()

    return NextResponse.json({
      success: true,
      platformFeePercentage: settings.platformFeePercentage,
      maintenanceMode: settings.maintenanceMode,
    })
  } catch (error) {
    console.error("[PATCH /api/admin/settings/global]", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
