"use client"

import { CustomerProfileForm } from "@/components/customer/settings/CustomerProfileForm"
import { CustomerDeliveryForm } from "@/components/customer/settings/CustomerDeliveryForm"
import { CustomerSecurityForms } from "@/components/customer/settings/CustomerSecurityForms"
import { Settings, Shield, MapPin } from "lucide-react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export function CustomerSettingsTabs({
  currentEmail,
}: {
  currentEmail: string
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentTab = searchParams.get("tab") || "profile"
  const activeTab = ["profile", "delivery", "security"].includes(currentTab)
    ? currentTab
    : "profile"

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account details and delivery preferences.
          </p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-[2px] whitespace-nowrap">
        <button
          onClick={() => handleTabChange("profile")}
          className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          }`}
        >
          <Settings className="size-4" />
          Personal Details
        </button>
        <button
          onClick={() => handleTabChange("delivery")}
          className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
            activeTab === "delivery"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          }`}
        >
          <MapPin className="size-4" />
          Delivery Preferences
        </button>
        <button
          onClick={() => handleTabChange("security")}
          className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
            activeTab === "security"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          }`}
        >
          <Shield className="size-4" />
          Account Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl pt-2">
        {activeTab === "profile" && (
          <div className="space-y-4">
            <CustomerProfileForm />
          </div>
        )}

        {activeTab === "delivery" && (
          <div className="space-y-4">
            <CustomerDeliveryForm />
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6">
              <CustomerSecurityForms currentEmail={currentEmail} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
