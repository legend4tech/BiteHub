import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface AdminStaff {
  _id: string
  name: string
  email: string
  role: "superadmin" | "admin" | "vendor_manager"
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export function useAdminStaff() {
  return useQuery<AdminStaff[], Error>({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/staff")
      return res.data
    },
  })
}
