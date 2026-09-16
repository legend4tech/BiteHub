import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

import type { AnalyticsData } from "@/types/admin"

export function useAdminAnalytics(range: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["admin", "analytics", range, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ range })
      if (range === "custom" && from && to) {
        params.set("from", from)
        params.set("to", to)
      }
      const { data } = await apiClient.get<AnalyticsData>(
        `/admin/analytics?${params.toString()}`
      )
      return data
    },
    refetchInterval: 60000, // 1 minute
  })
}
