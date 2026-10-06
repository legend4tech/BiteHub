import { auth } from "@/auth"
import { CustomerOrderList } from "@/components/customer/orders/CustomerOrderList"
import { EmptyState } from "@/components/shared/EmptyState"
import { getCustomerOrdersPaginated } from "@/lib/services/orderService"
export default async function CustomerOrdersPage() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }
  const limit = 20
  const { orders, hasMore } = await getCustomerOrdersPaginated(
    session.user.email,
    1,
    limit
  )
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">
            View your past orders and their status.
          </p>
        </div>
      </div>
      {orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="You haven't placed any orders yet."
          action={{ label: "Browse Menus", href: "/" }}
          className="rounded-xl border border-dashed border-border bg-card/50"
        />
      ) : (
        <CustomerOrderList initialOrders={orders} hasMoreInitial={hasMore} />
      )}
    </div>
  )
}
