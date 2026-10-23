import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import type {} from "@/types/customer"
import type { CustomerOrdersPageData } from "@/types/customer"
interface UseCustomerOrdersParams {
  status?: string
  limit?: number
  initialPage?: number
  enabled?: boolean
}
export function useCustomerOrders({
  status = "all",
  limit = 20,
  initialPage = 1,
  enabled = true,
}: UseCustomerOrdersParams = {}) {
  return useInfiniteQuery<CustomerOrdersPageData>({
    queryKey: ["customer-orders", status, limit],
    initialPageParam: initialPage,
    queryFn: async ({ pageParam }) => {
      const statusQuery =
        status && status !== "all"
          ? `&status=${encodeURIComponent(status)}`
          : ""
      const { data } = await axios.get(
        `/api/customer/orders?page=${pageParam}&limit=${limit}${statusQuery}`
      )
      return data
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1
      }
      return undefined
    },
    enabled,
  })
}
