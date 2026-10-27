import { NextResponse } from "next/server"
import { getMaintenanceMode } from "@/lib/services/settingService"

export async function GET() {
  try {
    const maintenanceMode = await getMaintenanceMode()
    return NextResponse.json({ maintenanceMode })
  } catch (error) {
    console.error("[GET /api/maintenance]", error)
    return NextResponse.json(
      { maintenanceMode: process.env.MAINTENANCE_MODE === "true" },
      { status: 200 }
    )
  }
}
