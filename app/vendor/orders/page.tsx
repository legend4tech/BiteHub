import { auth } from "@/auth"
import { getVendorOrdersPaginated } from "@/lib/services/orderService"
import { VendorOrders } from "@/components/vendor-dashboard/VendorOrders"
import { Types } from "mongoose"
import { redirect } from "next/navigation"
import type { Order as OrderType } from "@/types/shared"

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>
}) {
  const session = await auth()
  if (!session || session.user?.role !== "vendor" || !session.user?.vendorId) {
    redirect("/vendor/login")
  }
  const vendorId = session.user.vendorId

  const resolvedSearchParams = await searchParams
  const activeStatus = resolvedSearchParams.status || "all"
  const searchQuery = resolvedSearchParams.q || ""
  const page = parseInt(resolvedSearchParams.page || "1", 10)
  const limit = 20

  const { orders, counts, totalPages } = await getVendorOrdersPaginated({
    vendorId,
    status: activeStatus,
    q: searchQuery,
    page,
    limit,
  })

  return (
    <VendorOrders
      orders={orders}
      counts={counts}
      activeStatus={activeStatus}
      currentPage={page}
      totalPages={totalPages}
      searchQuery={searchQuery}
    />
  )
}
