import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import type {} from "@/types/customer"
import type { CustomerOrdersPageData } from "@/types/customer"
interface UseCustomerOrdersParams {
  limit?: number
  initialPage?: number
  enabled?: boolean
}
export function useCustomerOrders({
  limit = 20,
  initialPage = 1,
  enabled = true,
}: UseCustomerOrdersParams = {}) {
  return useInfiniteQuery<CustomerOrdersPageData>({
    queryKey: ["customer-orders", limit],
    initialPageParam: initialPage,
    queryFn: async ({ pageParam }) => {
      const { data } = await axios.get(
        `/api/customer/orders?page=${pageParam}&limit=${limit}`
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
