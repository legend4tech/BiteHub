import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { AdminVendor } from "@/components/admin/types"

export function useAdminVendors() {
  return useQuery<AdminVendor[]>({
    queryKey: ["admin-vendors"],
    queryFn: async () => (await apiClient.get("/admin/vendors")).data,
  })
}
