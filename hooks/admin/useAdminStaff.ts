import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { AdminStaff } from "@/types/admin"

export function useAdminStaff() {
  return useQuery<AdminStaff[], Error>({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/staff")
      return res.data
    },
  })
}
