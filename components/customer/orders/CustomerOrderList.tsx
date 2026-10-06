"use client"
import { useCustomerOrders } from "@/hooks/customer/useCustomerOrders"
import { CustomerOrderCard } from "@/components/customer/orders/CustomerOrderCard"
import { InfiniteScrollTrigger } from "@/components/shared/InfiniteScrollTrigger"
import { CustomerOrderCardSkeleton } from "@/components/shared/skeletons/CustomerDashboardSkeletons"
import type { OrderRecord } from "@/types/customer"
interface CustomerOrderListProps {
  initialOrders: OrderRecord[]
  hasMoreInitial: boolean
}
export function CustomerOrderList({
  initialOrders,
  hasMoreInitial,
}: CustomerOrderListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCustomerOrders({
      limit: 20,
      initialPage: 1,
      enabled: true,
    })
  const orders = data
    ? data.pages.flatMap((page) => page.orders)
    : initialOrders
  // If react-query hasn't fetched yet, we use the server's boolean
  const finalHasNextPage = data ? hasNextPage : hasMoreInitial
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <CustomerOrderCard key={order.id} order={order} />
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
  )
}
