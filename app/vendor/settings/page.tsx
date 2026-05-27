import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import { serializeVendor } from "@/lib/serializers"
import { VendorSettingsTabs } from "@/components/vendor/VendorSettingsTabs"
import { redirect, notFound } from "next/navigation"
import type { Vendor } from "@/lib/types"

export default async function VendorSettingsPage() {
  const session = await auth()
  if (!session || session.user?.role !== "vendor" || !session.user?.vendorId) {
    redirect("/vendor/login")
  }

  await dbConnect()
  const vendor = await VendorModel.findById(session.user.vendorId).lean()

  if (!vendor) {
    notFound()
  }

  const serializedVendor = serializeVendor(vendor)
  const currentEmail = session.user.email || ""

  return (
    <VendorSettingsTabs
      serializedVendor={serializedVendor as Vendor}
      currentEmail={currentEmail}
    />
  )
}
