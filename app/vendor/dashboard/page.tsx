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
import { RefreshCw, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/format"
import { useVendorStats } from "@/hooks/queries/useVendorStats"
import { useVendorOrders } from "@/hooks/queries/useVendorOrders"

export default function VendorDashboardPage() {
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()
  const isReady = !!session?.user

  // ── Stats: server-side aggregation, just a handful of numbers ─────────────
  // No matter how many orders exist, MongoDB counts them — not the browser.
  const {
    data: stats,
    isLoading: loadingStats,
    isRefetching: refreshingStats,
    refetch: refetchStats,
  } = useVendorStats({ enabled: isReady })

  // ── Recent orders: only the 10 most recent for the table ──────────────────
  // We never load all orders on the dashboard — that belongs to /vendor/orders.
  const {
    data: recentOrders = [],
    isLoading: loadingOrders,
    isRefetching: refreshingOrders,
    refetch: refetchOrders,
  } = useVendorOrders({ limit: 10, enabled: isReady })

  const refreshing = refreshingStats || refreshingOrders
  const handleRefresh = () => {
    refetchStats()
    refetchOrders()
  }

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
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-1 flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <RefreshCw
              className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
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
                from {stats!.totalCompleted} completed order{stats!.totalCompleted !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
              <span className="text-2xl">💰</span>
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
                {stats?.todayOrders ?? 0} today · {stats?.totalOrders ?? 0} all-time
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
    </SectionErrorBoundary>
  )
}
