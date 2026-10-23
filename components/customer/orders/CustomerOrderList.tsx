"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCustomerOrders } from "@/hooks/customer/useCustomerOrders"
import { CustomerOrderCard } from "@/components/customer/orders/CustomerOrderCard"
import { InfiniteScrollTrigger } from "@/components/shared/InfiniteScrollTrigger"
import { CustomerOrderCardSkeleton } from "@/components/shared/skeletons/CustomerDashboardSkeletons"
import { EmptyState } from "@/components/shared/EmptyState"
import { ORDER_STATUS, ORDER_STATUS_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { OrderRecord } from "@/types/customer"
import type { OrderStatus } from "@/types/shared"

const CUSTOMER_STATUS_TABS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  {
    value: ORDER_STATUS.PENDING,
    label: "Awaiting Payment",
  },
  {
    value: ORDER_STATUS.CONFIRMED,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.CONFIRMED].label,
  },
  {
    value: ORDER_STATUS.PREPARING,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.PREPARING].label,
  },
  {
    value: ORDER_STATUS.READY,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.READY].label,
  },
  {
    value: ORDER_STATUS.COMPLETED,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.COMPLETED].label,
  },
  {
    value: ORDER_STATUS.CANCELLED,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.CANCELLED].label,
  },
]

interface CustomerOrderListProps {
  initialOrders: OrderRecord[]
  hasMoreInitial: boolean
  initialCounts?: Record<string, number>
  initialStatus?: string
}

export function CustomerOrderList({
  initialOrders,
  hasMoreInitial,
  initialCounts = {},
  initialStatus = "all",
}: CustomerOrderListProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPendingTransition, startTransition] = useTransition()

  const currentStatus = searchParams.get("status") || initialStatus || "all"

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = useCustomerOrders({
    status: currentStatus,
    limit: 20,
    initialPage: 1,
    enabled: true,
  })

  const isInitialStatus = currentStatus === (initialStatus || "all")
  const orders = data
    ? data.pages.flatMap((page) => page.orders)
    : isInitialStatus
      ? initialOrders
      : []

  const counts = data?.pages[0]?.counts || initialCounts

  // If react-query hasn't fetched yet and on initial status, use server's boolean
  const finalHasNextPage = data
    ? hasNextPage
    : isInitialStatus
      ? hasMoreInitial
      : false

  const handleTabChange = (statusValue: string) => {
    if (statusValue === currentStatus) return

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (statusValue === "all") {
        params.delete("status")
      } else {
        params.set("status", statusValue)
      }
      params.delete("page")
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  const showSkeleton =
    isPendingTransition ||
    isLoading ||
    (!data && !isInitialStatus) ||
    (isFetching && !isFetchingNextPage && !data)

  const activeTabObj = CUSTOMER_STATUS_TABS.find(
    (t) => t.value === currentStatus
  )
  const activeLabel = activeTabObj ? activeTabObj.label : "matching"

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {CUSTOMER_STATUS_TABS.map((tab) => {
          const count = counts[tab.value]
          const isActive = currentStatus === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <span>{tab.label}</span>
              {typeof count === "number" && (
                <span
                  className={cn(
                    "py-0.2 rounded-full px-1.5 text-[10px] font-bold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Orders List / Loading Skeleton / Empty State */}
      {showSkeleton ? (
        <div className="space-y-4">
          <CustomerOrderCardSkeleton />
          <CustomerOrderCardSkeleton />
          <CustomerOrderCardSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title={
            currentStatus === "all"
              ? "No orders found"
              : `No ${activeLabel} orders`
          }
          description={
            currentStatus === "all"
              ? "You haven't placed any orders yet."
              : `You don't have any orders currently marked as "${activeLabel}".`
          }
          action={{ label: "Browse Menus", href: "/menus" }}
          className="rounded-xl border border-dashed border-border bg-card/50"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <CustomerOrderCard key={order.id || order.orderId} order={order} />
          ))}
          {(finalHasNextPage || isFetchingNextPage) && (
            <InfiniteScrollTrigger
              hasNextPage={finalHasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              loadingContent={
                <div className="w-full space-y-4 py-4">
                  <CustomerOrderCardSkeleton />
                  <CustomerOrderCardSkeleton />
                </div>
              }
              loadingText="Loading older orders..."
              endText="You've reached the beginning of your order history."
            />
          )}
        </div>
      )}
    </div>
  )
}
