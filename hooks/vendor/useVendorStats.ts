"use client"

import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { VendorStats } from "@/types/vendor"

export function useVendorStats(options?: { enabled?: boolean }) {
  return useQuery<VendorStats>({
    queryKey: ["vendor-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/vendor/stats")
      return data as VendorStats
    },
    staleTime: 1000 * 30, // re-use cached data for 30s
    gcTime: 1000 * 60 * 5, // keep in cache for 5 minutes
    enabled: options?.enabled ?? true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff up to 10s
  })
}
