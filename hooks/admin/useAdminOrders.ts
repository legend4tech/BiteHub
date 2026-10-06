import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { OrdersResponse } from "@/types/admin"
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
