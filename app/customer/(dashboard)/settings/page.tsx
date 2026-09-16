import { auth } from "@/auth"
import { CustomerSettingsTabs } from "@/components/customer/settings/CustomerSettingsTabs"
import { redirect } from "next/navigation"

export default async function CustomerSettingsPage() {
  const session = await auth()

  if (!session || session.user?.role !== "customer") {
    redirect("/customer/login")
  }

  const currentEmail = session.user.email || ""

  return <CustomerSettingsTabs currentEmail={currentEmail} />
}
