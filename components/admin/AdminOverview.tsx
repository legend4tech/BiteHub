"use client"

import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  X,
  KeyRound,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import { formatPrice } from "@/lib/format"
import type { AdminStats, AdminVendor, AdminOrder } from "./types"
import type { AdminSection } from "./AdminSidebar"

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: boolean
  sub?: string
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 ${accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <div className="min-w-0">
        <p
          title={String(value)}
          className={`truncate font-heading text-2xl font-bold ${accent ? "text-primary" : ""}`}
        >
          {value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Overview Section ─────────────────────────────────────────────────────────

interface AdminOverviewProps {
  stats: AdminStats | undefined
  loadingStats: boolean
  noAccountVendors: AdminVendor[]
  onGoToVendors: () => void
  onRefresh: () => void
}

export function AdminOverview({
  stats,
  loadingStats,
  noAccountVendors,
  onGoToVendors,
  onRefresh,
}: AdminOverviewProps) {
  // Fetch the 5 most recent orders for the quick feed
  const { data: recentOrdersData, isLoading: loadingOrders } = useQuery<{
    orders: AdminOrder[]
  }>({
    queryKey: ["admin-recent-orders"],
    queryFn: async () =>
      (await apiClient.get("/admin/orders?page=1&limit=5")).data,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-status-pending/20 text-status-pending-foreground"
      case "confirmed":
        return "bg-status-confirmed/20 text-status-confirmed-foreground"
      case "preparing":
        return "bg-status-preparing/20 text-status-preparing-foreground"
      case "ready":
        return "bg-status-ready/20 text-status-ready-foreground"
      case "completed":
        return "bg-status-completed/20 text-status-completed-foreground"
      case "cancelled":
        return "bg-status-cancelled/20 text-status-cancelled-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform stats at a glance
          </p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          disabled={loadingStats}
        >
          Refresh Stats
        </Button>
      </div>

      {loadingStats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-border bg-card p-5"
            />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label="Total Vendors"
              value={stats.totalVendors}
              icon={Store}
              sub={`${stats.activeVendors} active`}
            />
            <StatCard
              label="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingBag}
              sub={`${stats.todayOrders} today`}
            />
            <StatCard
              label="Completed Orders"
              value={stats.completedOrders}
              icon={CheckCircle2}
              accent
            />
            <StatCard
              label="Gross Volume (GMV)"
              value={formatPrice(stats.grossVolume)}
              icon={TrendingUp}
              sub="Total money processed"
            />
            <StatCard
              label="Platform Profit"
              value={formatPrice(stats.platformProfit)}
              icon={TrendingUp}
              accent
              sub="BiteHub gross commission"
            />
            <StatCard
              label="Live Monnify Balance"
              value={
                stats.monnifyBalance !== null
                  ? formatPrice(stats.monnifyBalance)
                  : "N/A"
              }
              icon={TrendingUp}
              accent
              sub="Actual available cash"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Pending"
              value={stats.pendingOrders}
              icon={Clock}
              sub="Awaiting vendor"
            />
            <StatCard
              label="Active Vendors"
              value={stats.activeVendors}
              icon={Users}
              sub={`of ${stats.totalVendors} total`}
            />
            <StatCard
              label="Cancelled"
              value={stats.cancelledOrders}
              icon={X}
            />
            <StatCard
              label="Today's Orders"
              value={stats.todayOrders}
              icon={TrendingUp}
            />
          </div>

          {noAccountVendors.length > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-status-pending/30 bg-status-pending/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <KeyRound className="size-5 shrink-0 text-status-pending" />
                <div>
                  <p className="text-sm font-semibold text-status-pending-foreground">
                    {noAccountVendors.length} vendor
                    {noAccountVendors.length > 1 ? "s" : ""} without a login
                    account
                  </p>
                  <p className="text-xs text-muted-foreground">
                    They can&apos;t log in to their dashboard until you create
                    one.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGoToVendors}
                className="shrink-0 border-status-pending/30 text-status-pending-foreground hover:bg-status-pending/10"
              >
                Fix now
              </Button>
            </div>
          )}

          {/* Recent Orders Feed */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
              <h2 className="font-heading text-lg font-bold">
                Recent Live Orders
              </h2>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-preparing opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status-preparing"></span>
              </span>
            </div>
            {loadingOrders ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Loading recent orders...
              </div>
            ) : recentOrdersData?.orders &&
              recentOrdersData.orders.length > 0 ? (
              <div className="divide-y divide-border">
                {recentOrdersData.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm font-bold">
                        {order.orderId}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Customer
                        </p>
                        <p className="font-medium">{order.customerName}</p>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                        >
                          {order.customerPhone}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Vendor
                        </p>
                        <p className="font-medium">{order.vendorName}</p>
                        <a
                          href={`https://wa.me/${order.vendorWhatsappNumber.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                        >
                          {order.vendorWhatsappNumber}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No recent orders found.
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Failed to load stats.</p>
      )}
    </div>
  )
}
