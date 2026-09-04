"use client"

import { VendorSettingsForm } from "@/components/vendor-dashboard/VendorSettingsForm"
import { VendorSecurityForms } from "@/components/vendor-dashboard/VendorSecurityForms"
import { VendorPaymentForm } from "@/components/vendor-dashboard/VendorPaymentForm"
import { Settings, Shield, CreditCard } from "lucide-react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import type { Vendor } from "@/types/vendor"

export function VendorSettingsTabs({
  serializedVendor,
  currentEmail,
}: {
  serializedVendor: Vendor
  currentEmail: string
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentTab = searchParams.get("tab") || "profile"
  const activeTab = ["profile", "payment", "security"].includes(currentTab)
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
            Manage your store and account details
          </p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => handleTabChange("profile")}
          className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          }`}
        >
          <Settings className="size-4" />
          Store Profile
        </button>
        <button
          onClick={() => handleTabChange("payment")}
          className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
            activeTab === "payment"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          }`}
        >
          <CreditCard className="size-4" />
          Payment Info
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
      <div className="pt-2">
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="max-w-2xl rounded-3xl border border-border bg-card p-6">
              <VendorSettingsForm initial={serializedVendor} />
            </div>
          </div>
        )}

        {activeTab === "payment" && (
          <div className="space-y-4">
            <div className="max-w-2xl rounded-3xl border border-border bg-card p-6">
              <VendorPaymentForm initial={serializedVendor} />
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="max-w-2xl rounded-3xl border border-border bg-card p-6">
              <VendorSecurityForms currentEmail={currentEmail} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
