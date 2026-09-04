"use client"

import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface DashboardStats {
  totalVendors: number
  activeVendors: number
  totalOrders: number
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  byStatus: Record<string, number>
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/stats")
      return data as DashboardStats
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // Auto-refetch every minute
    retry: 1,
  })
}
