"use client"

import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface VendorStats {
  totalOrders: number
  todayOrders: number
  pending: number
  inProgress: number
  totalCompleted: number
  totalRevenue: number
}

export function useVendorStats(options?: { enabled?: boolean }) {
  return useQuery<VendorStats>({
    queryKey: ["vendor-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/vendor/stats")
      return data as VendorStats
    },
    staleTime: 1000 * 30,      // re-use cached data for 30s
    gcTime: 1000 * 60 * 5,    // keep in cache for 5 minutes
    enabled: options?.enabled ?? true,
    retry: 1,
  })
}
