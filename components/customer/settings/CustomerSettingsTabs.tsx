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
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => handleTabChange("profile")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "profile"
              ? "border border-primary bg-primary text-primary-foreground shadow-xs"
              : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          <Settings className="size-4" />
          Personal Details
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("delivery")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "delivery"
              ? "border border-primary bg-primary text-primary-foreground shadow-xs"
              : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          <MapPin className="size-4" />
          Delivery Preferences
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("security")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "security"
              ? "border border-primary bg-primary text-primary-foreground shadow-xs"
              : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
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
