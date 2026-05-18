"use client"

import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { Order } from "@/lib/types"

interface UseVendorOrdersOptions {
  status?: string
  limit?: number  
  enabled?: boolean
  refetchInterval?: number
  refetchIntervalInBackground?: boolean
  staleTime?: number
}

export function useVendorOrders(options?: UseVendorOrdersOptions) {
  const { 
    status, 
    limit, 
    enabled = true,
    refetchInterval,
    refetchIntervalInBackground,
    staleTime = 1000 * 30
  } = options || {}

  return useQuery({
    queryKey: ["vendor-orders", status, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (status && status !== "all") params.status = status
      if (limit && limit > 0) params.limit = limit

      const { data } = await apiClient.get("/vendor/orders", { params })
      return data as Order[]
    },
    staleTime,
    gcTime: 1000 * 60 * 5,
    enabled,
    retry: 1,
    refetchInterval,
    refetchIntervalInBackground,
  })
}
