"use client"

import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { DashboardStats } from "@/components/vendor-dashboard/DashboardStats"
import { OrderTable } from "@/components/vendor-dashboard/OrderTable"
import type { OrderStatus } from "@/lib/types"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { AlertBanner } from "@/components/shared/AlertBanner"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import { FetchError } from "@/components/shared/FetchError"
import {
  useVendorAcceptTerms,
  useVendorUpdateOrderStatus,
  useVendorUpdateOrderPayment,
} from "@/hooks/mutations/useVendorMutations"
import { toast } from "sonner"
import { ArrowRight, Star, Banknote, AlertCircle, Share2 } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/format"
import { APP_NAME, CURRENT_TERMS_VERSION } from "@/lib/constants"
import { useVendorOrders } from "@/hooks/queries/useVendorOrders"
import {
  useVendorStats,
  type VendorStats,
} from "@/hooks/queries/useVendorStats"
import { TermsAcceptanceModal } from "@/components/vendor-dashboard/TermsAcceptanceModal"
import { PlatformFeedbackModal } from "@/components/vendor-dashboard/PlatformFeedbackModal"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function VendorDashboardPage() {
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()
  const isReady = !!session?.user

  const [showPlatformFeedbackModal, setShowPlatformFeedbackModal] =
    useState(false)

  const [acceptingTerms, setAcceptingTerms] = useState(false)
  const [hasAcceptedLocally, setHasAcceptedLocally] = useState(false)

  useEffect(() => {
    if (isReady) {
      const submitted = localStorage.getItem("vendor_feedback_submitted")
      const snoozed = localStorage.getItem("vendor_feedback_snoozed")

      if (!submitted) {
        if (!snoozed) {
          setTimeout(() => setShowPlatformFeedbackModal(true), 0)
        } else {
          const snoozeTime = parseInt(snoozed, 10)
          if (new Date().getTime() > snoozeTime) {
            setTimeout(() => setShowPlatformFeedbackModal(true), 0)
          }
        }
      }
    }
  }, [isReady])
  const {
    data: stats,
    isPending: loadingStats,
    isError: isStatsError,
    refetch: refetchStats,
  } = useVendorStats({
    enabled: isReady,
  })

  // ── Terms Acceptance Check ─────────────────────────────────────────────────
  const needsTermsAcceptance =
    isReady &&
    !loadingStats &&
    stats &&
    stats.acceptedTermsVersion !== CURRENT_TERMS_VERSION &&
    !hasAcceptedLocally

  const acceptTermsMutation = useVendorAcceptTerms()

  const handleAcceptTerms = async (): Promise<void> => {
    setAcceptingTerms(true)
    acceptTermsMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Thank you! You have accepted the updated terms.")
        setHasAcceptedLocally(true)
        queryClient.invalidateQueries({ queryKey: ["vendor-stats"] })
      },
      onError: () => {
        toast.error("Couldn't record terms acceptance. Please try again.")
      },
      onSettled: () => {
        setAcceptingTerms(false)
      },
    })
  }

  // ── Recent orders: only the 10 most recent for the table ──────────────────
  // We never load all orders on the dashboard — that belongs to /vendor/orders.
  const {
    data: recentOrders = [],
    isPending: loadingOrders,
    isError: isOrdersError,
    refetch: refetchOrders,
  } = useVendorOrders({ limit: 10, enabled: isReady })

  const updateOrderStatusMutation = useVendorUpdateOrderStatus()

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatusMutation.mutate(
      { orderId, newStatus },
      {
        onSuccess: () => {
          toast.success("Order status updated successfully!")
          // Invalidate both — stats counts change when a status changes
          queryClient.invalidateQueries({ queryKey: ["vendor-stats"] })
          queryClient.invalidateQueries({ queryKey: ["vendor-orders"] })
        },
        onError: () => {
          toast.error(
            "Couldn't update order status. Please check your connection."
          )
        },
      }
    )
  }

  const updateOrderPaymentMutation = useVendorUpdateOrderPayment()

  const handlePaymentConfirm = (orderId: string) => {
    updateOrderPaymentMutation.mutate(
      { orderId, isPaid: true },
      {
        onSuccess: () => {
          toast.success("Payment confirmed successfully!")
          queryClient.invalidateQueries({ queryKey: ["vendor-stats"] })
          queryClient.invalidateQueries({ queryKey: ["vendor-orders"] })
        },
        onError: () => {
          toast.error("Couldn't confirm payment. Please check your connection.")
        },
      }
    )
  }

  const handleShareProfile = async () => {
    if (!stats?.slug) return
    const url = `${window.location.origin}/vendors/${stats.slug}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Order from my restaurant on BiteHub!",
          url: url,
        })
      } catch {
        // user cancelled or failed sharing
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Profile link copied to clipboard!")
    }
  }

  const now = new Date()
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening"

  return (
    <SectionErrorBoundary title="Couldn't load dashboard">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {greeting},
            </p>
            <h1 className="mt-0.5 flex h-9 items-center font-heading text-2xl font-bold md:text-3xl">
              {status === "loading" ? (
                <div className="h-8 w-48 animate-pulse rounded-md bg-muted/60"></div>
              ) : (
                session?.user?.name || "Vendor"
              )}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleShareProfile}
              disabled={loadingStats || !stats?.slug}
            >
              <Share2 className="size-4" />
              <span className="hidden sm:inline">Share Profile</span>
              <span className="sm:hidden">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowPlatformFeedbackModal(true)}
            >
              <Star className="size-4" />
              <span className="hidden sm:inline">Rate Platform</span>
              <span className="sm:hidden">Rate</span>
            </Button>
          </div>
        </div>

        {/* Warning banner for missing payment details */}
        {!loadingStats &&
          !isStatsError &&
          stats?.hasPaymentDetails === false && (
            <AlertBanner
              title="Complete your profile to be visible!"
              description="One more step! Please connect your bank account so customers can pay you securely. Your vendor profile will NOT be visible publicly until you do this."
              icon={AlertCircle}
              variant="destructive"
              action={{
                label: "Add Details",
                href: "/vendor/settings?tab=payment",
              }}
            />
          )}

        {/* Stats — sourced from server-side aggregation, not client filtering */}
        {loadingStats ? (
          <div className="flex flex-col gap-4 md:gap-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`order-skel-${i}`}
                  className="flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/40 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted" />
                  </div>
                  <div className="mt-1 space-y-2">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="hidden h-2 w-full animate-pulse rounded bg-muted sm:block" />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`fin-skel-${i}`}
                  className="flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/40 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted" />
                  </div>
                  <div className="mt-1 space-y-2">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="hidden h-2 w-full animate-pulse rounded bg-muted sm:block" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isStatsError ? (
          <div className="rounded-3xl border border-border/50 bg-card py-10">
            <FetchError
              title="Couldn't load stats"
              onRetry={() => refetchStats()}
              size="md"
            />
          </div>
        ) : (
          <DashboardStats
            totalOrders={stats?.totalOrders ?? 0}
            todayOrders={stats?.todayOrders ?? 0}
            pending={stats?.pending ?? 0}
            inProgress={stats?.inProgress ?? 0}
            totalCompleted={stats?.totalCompleted ?? 0}
            monnifyDisbursed={stats?.monnifyDisbursed ?? 0}
            monnifyPending={stats?.monnifyPending ?? 0}
          />
        )}

        {/* Recent orders — capped at 10, full list is at /vendor/orders */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-heading text-base font-bold">
                Recent Orders
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isStatsError ? "-" : (stats?.todayOrders ?? 0)} today ·{" "}
                {isStatsError ? "-" : (stats?.totalOrders ?? 0)} all-time
              </p>
            </div>
            <Link
              href="/vendor/orders"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="p-5">
            {loadingOrders ? (
              <PageSkeleton variant="orders-table" count={4} />
            ) : isOrdersError ? (
              <div className="py-6">
                <FetchError
                  title="Couldn't load orders"
                  onRetry={() => refetchOrders()}
                  size="sm"
                />
              </div>
            ) : recentOrders.length === 0 ? (
              <EmptyState
                size="sm"
                title="No orders yet"
                description="When customers place orders, they will appear here."
              />
            ) : (
              <OrderTable
                orders={recentOrders}
                onStatusChange={handleStatusChange}
                onPaymentConfirm={handlePaymentConfirm}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Platform Feedback Modal for Vendors ────────────────── */}
      <PlatformFeedbackModal
        open={showPlatformFeedbackModal}
        onOpenChange={setShowPlatformFeedbackModal}
        vendorId={session?.user?.vendorId}
      />

      {/* ── Terms & Privacy Acceptance Compliance Modal ────────────────── */}
      <TermsAcceptanceModal
        open={!!needsTermsAcceptance}
        isNewcomer={!!(stats as VendorStats)?.isNewcomer}
        acceptingTerms={acceptingTerms}
        onAccept={handleAcceptTerms}
      />
    </SectionErrorBoundary>
  )
}
