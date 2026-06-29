import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import GlobalSettings from "@/models/GlobalSettings"
import { auth } from "@/auth"
import { globalSettingsSchema } from "@/lib/schemas"

const settingsSchema = globalSettingsSchema.partial()

// Helper to get or create the singleton settings document
async function getSettings() {
  let settings = await GlobalSettings.findOne()
  if (!settings) {
    settings = await GlobalSettings.create({
      platformFeePercentage: Number(
        process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || 5
      ),
      maintenanceMode: process.env.MAINTENANCE_MODE === "true",
      updatedBy: "system",
    })
  }
  return settings
}

export async function GET() {
  try {
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

    await dbConnect()
    const body = await request.json()

    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      )
    }

    const settings = await getSettings()

    if (parsed.data.platformFeePercentage !== undefined) {
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
