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
  options?: Omit<
    UseQueryOptions<OrdersResponse, Error, OrdersResponse, (string | number)[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<OrdersResponse, Error, OrdersResponse, (string | number)[]>({
    queryKey: ["admin-orders", page, limit],
    queryFn: async () => {
      const res = await apiClient.get(
        `/admin/orders?page=${page}&limit=${limit}`
      )
      return res.data
    },
    ...options,
  })
}
