"use client"

import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { DashboardStats } from "@/components/vendor/DashboardStats"
import { OrderTable } from "@/components/vendor/OrderTable"
import type { OrderStatus } from "@/lib/types"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import apiClient from "@/lib/axios"
import { toast } from "sonner"
import { ArrowRight, Star, Banknote } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/format"
import { APP_NAME } from "@/lib/constants"
import { useVendorOrders } from "@/hooks/queries/useVendorOrders"
import { useVendorStats } from "@/hooks/queries/useVendorStats"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

export default function VendorDashboardPage() {
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()
  const isReady = !!session?.user

  const [showPlatformFeedbackModal, setShowPlatformFeedbackModal] =
    useState(false)
  const [platformRating, setPlatformRating] = useState(0)
  const [platformComments, setPlatformComments] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)

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
  // ── Stats: server-side aggregation, just a handful of numbers ─────────────
  // No matter how many orders exist, MongoDB counts them — not the browser.
  const { data: stats, isLoading: loadingStats } = useVendorStats({
    enabled: isReady,
  })

  // ── Recent orders: only the 10 most recent for the table ──────────────────
  // We never load all orders on the dashboard — that belongs to /vendor/orders.
  const { data: recentOrders = [], isLoading: loadingOrders } = useVendorOrders(
    { limit: 10, enabled: isReady }
  )

  if (status === "loading") {
    return <PageSkeleton variant="dashboard" />
  }

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      await apiClient.patch(`/vendor/orders/${orderId}`, { status: newStatus })
      toast.success("Order status updated successfully!")
      // Invalidate both — stats counts change when a status changes
      await queryClient.invalidateQueries({ queryKey: ["vendor-stats"] })
      await queryClient.invalidateQueries({ queryKey: ["vendor-orders"] })
    } catch {
      toast.error("Failed to update order status")
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {greeting},
            </p>
            <h1 className="mt-0.5 font-heading text-2xl font-bold md:text-3xl">
              {session?.user?.name || "Vendor"} 👋
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowPlatformFeedbackModal(true)}
          >
            <Star className="size-4" />
            Rate Platform
          </Button>
        </div>

        {/* Total Revenue banner */}
        {!loadingStats && (stats?.totalRevenue ?? 0) > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-orange-500/5 px-5 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                Total Revenue
              </p>
              <p className="mt-1 font-heading text-3xl font-bold text-primary">
                {formatPrice(stats!.totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                from {stats!.totalCompleted} completed order
                {stats!.totalCompleted !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
              <Banknote className="size-6 text-primary" />
            </div>
          </div>
        )}

        {/* Stats — sourced from server-side aggregation, not client filtering */}
        {loadingStats ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-border bg-card p-5"
              />
            ))}
          </div>
        ) : (
          <DashboardStats
            totalOrders={stats?.totalOrders ?? 0}
            todayOrders={stats?.todayOrders ?? 0}
            pending={stats?.pending ?? 0}
            inProgress={stats?.inProgress ?? 0}
            totalCompleted={stats?.totalCompleted ?? 0}
            totalRevenue={stats?.totalRevenue ?? 0}
          />
        )}

        {/* Recent orders — capped at 10, full list is at /vendor/orders */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-heading text-base font-bold">
                Recent Orders
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stats?.todayOrders ?? 0} today · {stats?.totalOrders ?? 0}{" "}
                all-time
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
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Platform Feedback Modal for Vendors ────────────────── */}
      <AlertDialog
        open={showPlatformFeedbackModal}
        onOpenChange={setShowPlatformFeedbackModal}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl font-bold">
              Rate the Platform
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              How was your experience using {APP_NAME} as a vendor? We&apos;d
              love to hear your thoughts!
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPlatformRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`size-6 transition-colors ${
                        (hoveredRating || platformRating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Comments <span className="text-destructive">*</span>
              </label>
              <textarea
                value={platformComments}
                onChange={(e) => setPlatformComments(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                rows={4}
                placeholder="Tell us what you liked or what we can improve (required, min 3 chars)..."
              />
            </div>
          </div>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <AlertDialogCancel
              onClick={() => {
                const snoozeTime =
                  new Date().getTime() + 5 * 24 * 60 * 60 * 1000 // 5 days
                localStorage.setItem(
                  "vendor_feedback_snoozed",
                  snoozeTime.toString()
                )
                setShowPlatformFeedbackModal(false)
              }}
              className="w-full sm:w-auto"
            >
              Maybe later
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const response = await fetch("/api/feedback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      vendorId: session?.user?.vendorId,
                      platform: {
                        rating: platformRating,
                        comments: platformComments,
                      },
                    }),
                  })

                  if (response.ok) {
                    toast.success("Feedback submitted! Thank you.")
                    localStorage.setItem("vendor_feedback_submitted", "true")
                    setShowPlatformFeedbackModal(false)
                    setPlatformRating(0)
                    setPlatformComments("")
                  } else {
                    toast.error("Failed to submit feedback.")
                  }
                } catch {
                  toast.error("An error occurred.")
                }
              }}
              disabled={
                platformRating === 0 || platformComments.trim().length < 3
              }
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionErrorBoundary>
  )
}
