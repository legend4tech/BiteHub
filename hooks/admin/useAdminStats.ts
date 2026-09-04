import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { AdminStats } from "@/components/admin/types"

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await apiClient.get("/admin/stats")).data,
  })
}
