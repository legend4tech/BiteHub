import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface AdminOrder {
  id: string
  orderId: string
  vendorId: string
  vendorName: string
  vendorWhatsappNumber: string
  items: Array<{
    menuItemId: string
    name: string
    price: number
    quantity: number
  }>
  customerName: string
  customerEmail: string
  customerPhone: string
  location: string
  notes?: string
  totalAmount: number
  status: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
}

export interface OrdersResponse {
  orders: AdminOrder[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

export function useAdminOrders(
  page: number,
  limit: number,
  excludeStatus?: string,
  status?: string,
  options?: Omit<
    UseQueryOptions<
      OrdersResponse,
      Error,
      OrdersResponse,
      (string | number | undefined)[]
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<
    OrdersResponse,
    Error,
    OrdersResponse,
    (string | number | undefined)[]
  >({
    queryKey: ["admin-orders", page, limit, excludeStatus, status],
    queryFn: async () => {
      let url = `/admin/orders?page=${page}&limit=${limit}`
      if (excludeStatus) url += `&excludeStatus=${excludeStatus}`
      if (status) url += `&status=${status}`
      const res = await apiClient.get(url)
      return res.data
    },
    ...options,
  })
}
