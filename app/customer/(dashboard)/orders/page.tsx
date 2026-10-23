import { auth } from "@/auth"
import { CustomerOrderList } from "@/components/customer/orders/CustomerOrderList"
import { getCustomerOrdersPaginated } from "@/lib/services/orderService"

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  const resolvedParams = await searchParams
  const activeStatus = resolvedParams.status || "all"
  const limit = 20

  const { orders, hasMore, counts } = await getCustomerOrdersPaginated({
    email: session.user.email,
    customerId: session.user.id,
    status: activeStatus,
    page: 1,
    limit,
  })

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

      <CustomerOrderList
        initialOrders={orders}
        hasMoreInitial={hasMore}
        initialCounts={counts}
        initialStatus={activeStatus}
      />
    </div>
  )
}
