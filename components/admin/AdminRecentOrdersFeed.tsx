import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { Skeleton } from "@/components/ui/skeleton"
import type { OrderStatus } from "@/types/shared"
import type { AdminOrder } from "@/types/admin"

interface AdminRecentOrdersFeedProps {
  loadingOrders: boolean
  error?: boolean
  onRetry?: () => void
  recentOrdersData: { orders: AdminOrder[] } | undefined | null
}

export function AdminRecentOrdersFeed({
  loadingOrders,
  error,
  onRetry,
  recentOrdersData,
}: AdminRecentOrdersFeedProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
        <h2 className="font-heading text-lg font-bold">Recent Live Orders</h2>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-preparing opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-status-preparing"></span>
        </span>
      </div>
      {loadingOrders ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 px-6 py-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6">
          <FetchError
            message="Failed to load recent orders."
            onRetry={onRetry || (() => {})}
          />
        </div>
      ) : recentOrdersData?.orders && recentOrdersData.orders.length > 0 ? (
        <div className="divide-y divide-border">
          {recentOrdersData.orders.map((order: AdminOrder) => (
            <div
              key={order.id}
              className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-bold">{order.orderId}</p>
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
          title="No recent orders"
          description="Live orders will appear here as they come in."
          size="sm"
        />
      )}
    </div>
  )
}
