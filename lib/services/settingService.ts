/**
 * settingService.ts
 *
 * Server-only service for global application settings database queries.
 * Safe from Next.js client-side bundle leakage.
 */

import dbConnect from "@/lib/db"
import GlobalSettings from "@/models/GlobalSettings"
import { DEFAULT_PLATFORM_FEE_PERCENTAGE } from "@/lib/constants"

export async function getPlatformFeePercentage(): Promise<number> {
  await dbConnect()
  const settings = (await GlobalSettings.findOne().lean()) as {
    platformFeePercentage?: number
  } | null
  return settings?.platformFeePercentage ?? DEFAULT_PLATFORM_FEE_PERCENTAGE
}
