import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface MaintenanceStatus {
  maintenanceMode: boolean
}

export function useMaintenanceMode(
  options?: Omit<
    UseQueryOptions<MaintenanceStatus, Error, MaintenanceStatus, string[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<MaintenanceStatus, Error, MaintenanceStatus, string[]>({
    queryKey: ["maintenance-mode"],
    queryFn: async () => {
      const res = await apiClient.get<MaintenanceStatus>("/maintenance")
      return res.data
    },
    ...options,
  })
}
