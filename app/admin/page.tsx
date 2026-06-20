"use client"

import { useState, useTransition, useOptimistic } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
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
  } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await apiClient.get("/admin/stats")).data,
  })

  const {
    data: vendorsData,
    isLoading: loadingVendors,
    isError: isVendorsError,
    refetch: refetchVendors,
  } = useQuery<AdminVendor[]>({
    queryKey: ["admin-vendors"],
    queryFn: async () => (await apiClient.get("/admin/vendors")).data,
  })

  const {
    data: feedbacks,
    isLoading: loadingFeedback,
    isError: isFeedbackError,
    refetch: refetchFeedback,
  } = useQuery<Feedback[]>({
    queryKey: ["admin-feedback"],
    queryFn: async () => (await apiClient.get("/admin/feedback")).data,
  })

  const vendors = vendorsData ?? []

  const [, startTransition] = useTransition()
  const [optimisticVendors, addOptimisticVendor] = useOptimistic(
    vendors,
    (state, updated: AdminVendor) =>
      state.map((v) => (v.id === updated.id ? updated : v))
  )

  const noAccountVendors = optimisticVendors.filter((v) => !v.account)

  const toggleVendorActive = (vendor: AdminVendor) => {
    setTogglingId(vendor.id)
    addOptimisticVendor({ ...vendor, isActive: !vendor.isActive })
    startTransition(async () => {
      try {
        await apiClient.patch(`/admin/vendors/${vendor.id}`, {
          isActive: !vendor.isActive,
        })
        await queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
        toast.success(
          `Vendor ${!vendor.isActive ? "activated" : "deactivated"}`
        )
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } }
        toast.error(err.response?.data?.error || "An error occurred")
      } finally {
        setTogglingId(null)
      }
    })
  }

  const toggleVendorFeatured = (vendor: AdminVendor) => {
    setTogglingFeaturedId(vendor.id)
    addOptimisticVendor({ ...vendor, isFeatured: !vendor.isFeatured })
    startTransition(async () => {
      try {
        await apiClient.patch(`/admin/vendors/${vendor.id}`, {
          isFeatured: !vendor.isFeatured,
        })
        await queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
        toast.success(
          `${vendor.name} is ${!vendor.isFeatured ? "now featured" : "no longer featured"}`
        )
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } }
        toast.error(err.response?.data?.error || "An error occurred")
      } finally {
        setTogglingFeaturedId(null)
      }
    })
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
