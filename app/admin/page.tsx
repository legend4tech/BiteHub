"use client"

import { useState, useTransition, useOptimistic } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { useAdminStats } from "@/hooks/queries/useAdminStats"
import { useAdminVendors } from "@/hooks/queries/useAdminVendors"
import { useAdminFeedback } from "@/hooks/queries/useAdminFeedback"
import { toast } from "sonner"
import {
  useAdminToggleVendorActive,
  useAdminToggleVendorFeatured,
} from "@/hooks/mutations/useAdminMutations"
import Image from "next/image"
import { APP_LOGO_URL, APP_NAME } from "@/lib/constants"
import {
  AdminSidebar,
  AdminMobileTrigger,
  type AdminSection,
} from "@/components/admin/AdminSidebar"
import { AdminOverview } from "@/components/admin/AdminOverview"
import { AdminOrders } from "@/components/admin/AdminOrders"
import { AdminVendors } from "@/components/admin/AdminVendors"
import { AdminFeedback, type Feedback } from "@/components/admin/AdminFeedback"
import { AdminSettings } from "@/components/admin/AdminSettings"
import { AdminDeliveryZones } from "@/components/admin/AdminDeliveryZones"
import { AddLoginModal, AddVendorModal } from "@/components/admin/AdminModals"
import type { AdminStats, AdminVendor } from "@/components/admin/types"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import { FetchError } from "@/components/shared/FetchError"

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(
    null
  )
  const [addLoginFor, setAddLoginFor] = useState<AdminVendor | null>(null)
  const [showAddVendor, setShowAddVendor] = useState(false)
  const queryClient = useQueryClient()

  const {
    data: stats,
    isLoading: loadingStats,
    isError: isStatsError,
    refetch: refetchStats,
  } = useAdminStats()

  const {
    data: vendorsData,
    isLoading: loadingVendors,
    isError: isVendorsError,
    refetch: refetchVendors,
  } = useAdminVendors()

  const {
    data: feedbacks,
    isLoading: loadingFeedback,
    isError: isFeedbackError,
    refetch: refetchFeedback,
  } = useAdminFeedback()

  const vendors = vendorsData ?? []

  const [, startTransition] = useTransition()
  const [optimisticVendors, addOptimisticVendor] = useOptimistic(
    vendors,
    (state, updated: AdminVendor) =>
      state.map((v) => (v.id === updated.id ? updated : v))
  )

  const noAccountVendors = optimisticVendors.filter((v) => !v.account)

  const toggleActiveMutation = useAdminToggleVendorActive()
  const toggleFeaturedMutation = useAdminToggleVendorFeatured()

  const toggleVendorActive = (vendor: AdminVendor) => {
    setTogglingId(vendor.id)
    addOptimisticVendor({ ...vendor, isActive: !vendor.isActive })

    toggleActiveMutation.mutate(
      { vendorId: vendor.id, isActive: !vendor.isActive },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
          toast.success(
            `Vendor ${!vendor.isActive ? "activated" : "deactivated"}`
          )
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          toast.error(err.response?.data?.error || "An error occurred")
        },
        onSettled: () => {
          setTogglingId(null)
        },
      }
    )
  }

  const toggleVendorFeatured = (vendor: AdminVendor) => {
    setTogglingFeaturedId(vendor.id)
    addOptimisticVendor({ ...vendor, isFeatured: !vendor.isFeatured })

    toggleFeaturedMutation.mutate(
      { vendorId: vendor.id, isFeatured: !vendor.isFeatured },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
          toast.success(
            `${vendor.name} is ${!vendor.isFeatured ? "now featured" : "no longer featured"}`
          )
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          toast.error(err.response?.data?.error || "An error occurred")
        },
        onSettled: () => {
          setTogglingFeaturedId(null)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top-bar */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md md:hidden">
          <AdminMobileTrigger
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={APP_LOGO_URL}
              alt={APP_NAME}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="font-heading text-lg leading-none font-black tracking-tight">
              Bite<span className="text-primary">Hub</span>
            </span>
          </Link>
          <div className="w-9" />
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <SectionErrorBoundary title="Couldn't load admin dashboard">
            <div className="mx-auto max-w-6xl px-6 py-8">
              {activeSection === "overview" &&
                (isStatsError ? (
                  <FetchError
                    title="Couldn't load overview stats"
                    onRetry={() => refetchStats()}
                  />
                ) : (
                  <AdminOverview
                    stats={stats}
                    loadingStats={loadingStats}
                    noAccountVendors={noAccountVendors}
                    onGoToVendors={() => setActiveSection("vendors")}
                    onRefresh={() => refetchStats()}
                  />
                ))}
              {activeSection === "orders" && <AdminOrders />}
              {activeSection === "vendors" &&
                (isVendorsError ? (
                  <FetchError
                    title="Couldn't load vendors"
                    onRetry={() => refetchVendors()}
                  />
                ) : (
                  <AdminVendors
                    vendors={vendors}
                    optimisticVendors={optimisticVendors}
                    loadingVendors={loadingVendors}
                    noAccountVendors={noAccountVendors}
                    togglingId={togglingId}
                    togglingFeaturedId={togglingFeaturedId}
                    onToggleActive={toggleVendorActive}
                    onToggleFeatured={toggleVendorFeatured}
                    onAddLogin={setAddLoginFor}
                  />
                ))}
              {activeSection === "feedback" &&
                (isFeedbackError ? (
                  <FetchError
                    title="Couldn't load feedback"
                    onRetry={() => refetchFeedback()}
                  />
                ) : (
                  <AdminFeedback
                    feedbacks={feedbacks}
                    loadingFeedback={loadingFeedback}
                  />
                ))}
              {activeSection === "delivery-zones" && <AdminDeliveryZones />}
              {activeSection === "settings" && <AdminSettings />}
            </div>
          </SectionErrorBoundary>
        </main>
      </div>

      {addLoginFor && (
        <AddLoginModal
          vendor={addLoginFor}
          onClose={() => setAddLoginFor(null)}
          onSuccess={refetchVendors}
        />
      )}
      {showAddVendor && (
        <AddVendorModal
          onClose={() => setShowAddVendor(false)}
          onSuccess={refetchVendors}
        />
      )}
    </div>
  )
}
