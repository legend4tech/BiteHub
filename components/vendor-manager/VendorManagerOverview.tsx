"use client"

import { ShoppingBag, Clock, Users, Store, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminOrders } from "@/hooks/admin/useAdminOrders"
import { useAdminStats } from "@/hooks/admin/useAdminStats"
import { ORDER_STATUS } from "@/lib/constants"
import type { AdminStats } from "@/types/admin"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { OrderStatus } from "@/types/shared"
import Link from "next/link"

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

export function VendorManagerOverview() {
  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useAdminStats()

  // Fetch only active orders for the live feed (confirmed, preparing, ready)
  const activeStatuses = `${ORDER_STATUS.CONFIRMED},${ORDER_STATUS.PREPARING},${ORDER_STATUS.READY}`

  const { data: recentOrdersData, isLoading: loadingOrders } = useAdminOrders(
    1,
    5,
    undefined,
    activeStatuses,
    {
      refetchInterval: 15000, // Auto-refresh every 15 seconds for live feed
    }
  )

  const activeOrdersCount = stats?.preparingOrders ?? 0 // Currently 'preparing' or 'ready' would be active

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform operations and vendor health at a glance
          </p>
        </div>
        <Button
          onClick={() => refetchStats()}
          variant="outline"
          size="sm"
          disabled={loadingStats}
        >
          Refresh Stats
        </Button>
      </div>

      {loadingStats ? (
        <PageSkeleton variant="admin-overview-stats" count={4} />
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Vendors"
            value={stats.totalVendors}
            icon={Store}
            sub={`${stats.activeVendors} active`}
          />
          <StatCard
            label="Active Vendors"
            value={stats.activeVendors}
            icon={Users}
            sub={`of ${stats.totalVendors} total`}
          />
          <StatCard
            label="Confirmed Orders"
            value={stats.confirmedOrders}
            icon={Clock}
            accent
            sub="Paid, awaiting prep"
          />
          <StatCard
            label="Active Orders"
            value={stats.preparingOrders}
            icon={ShoppingBag}
            sub="Currently preparing"
          />
        </div>
      ) : (
        <FetchError
          message="Failed to load stats."
          onRetry={() => refetchStats()}
        />
      )}

      {/* Actionable Alerts */}
      {stats && stats.vendorsWithoutMenus > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-status-pending/30 bg-status-pending/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="size-5 shrink-0 text-status-pending" />
            <div>
              <p className="text-sm font-semibold text-status-pending-foreground">
                {stats.vendorsWithoutMenus} active vendor
                {stats.vendorsWithoutMenus > 1 ? "s have" : " has"} no menu
                items
              </p>
              <p className="text-xs text-muted-foreground">
                Follow up with them to add items, otherwise their storefront
                will be empty.
              </p>
            </div>
          </div>
          <Link href="/vendor-manager/vendors">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-status-pending/30 text-status-pending-foreground hover:bg-status-pending/10"
            >
              View Vendors
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Actionable Orders Feed */}
      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="font-heading text-lg font-bold">
            Live Actionable Orders
          </h2>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-preparing opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-status-preparing"></span>
          </span>
        </div>
        {loadingOrders ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Loading active orders...
          </div>
        ) : recentOrdersData?.orders && recentOrdersData.orders.length > 0 ? (
          <div className="divide-y divide-border">
            {recentOrdersData.orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/order/${order.orderId}`}
                    target="_blank"
                    className="font-mono text-sm font-bold transition-colors hover:text-primary hover:underline"
                  >
                    {order.orderId}
                  </Link>
                  <StatusBadge
                    status={order.status as OrderStatus}
                    paymentStatus={order.paymentStatus}
                  />
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
          <EmptyState
            title="All caught up!"
            description="No actionable orders at the moment."
            size="sm"
          />
        )}
      </div>
    </div>
  )
}
