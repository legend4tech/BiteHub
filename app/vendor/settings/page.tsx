import { auth } from "@/auth"
import { getVendorProfile } from "@/lib/services/vendorService"
import { VendorSettingsTabs } from "@/components/vendor-dashboard/VendorSettingsTabs"
import { redirect, notFound } from "next/navigation"
import type { Vendor } from "@/types/vendor"

export default async function VendorSettingsPage() {
  const session = await auth()
  if (!session || session.user?.role !== "vendor" || !session.user?.vendorId) {
    redirect("/vendor/login")
  }

  const vendor = await getVendorProfile(session.user.vendorId)

  if (!vendor) {
    notFound()
  }

  const currentEmail = session.user.email || ""

  return (
    <VendorSettingsTabs
      serializedVendor={vendor as Vendor}
      currentEmail={currentEmail}
    />
  )
}
