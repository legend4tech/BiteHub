import { auth } from "@/auth"
import { VendorManagerOverview } from "@/components/vendor-manager/VendorManagerOverview"
import { VendorManagerWelcomeHeader } from "@/components/vendor-manager/VendorManagerWelcomeHeader"

export default async function VendorManagerPage() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <VendorManagerWelcomeHeader />

      <VendorManagerOverview />
    </div>
  )
}
