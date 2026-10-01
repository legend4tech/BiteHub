import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import { toast } from "sonner"
import type { AxiosError } from "axios"

export interface CustomerData {
  id: string
  name: string
  email: string
  phone: string
  referralCode: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface CustomersResponse {
  customers: CustomerData[]
  total: number
  pages: number
  currentPage: number
}

export function useAdminCustomers(page: number, search: string) {
  return useQuery({
    queryKey: ["admin", "customers", { page, search }],
    queryFn: async () => {
      const res = await apiClient.get<CustomersResponse>("/admin/customers", {
        params: { page, limit: 20, search },
      })
      return res.data
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  })
}

export function useToggleCustomerStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiClient.patch(`/admin/customers/${id}`, { isActive })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      // Invalidate the customers query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] })
    },
    onError: (error: AxiosError<{ error?: string }>) => {
      toast.error(
        error.response?.data?.error || "Failed to update customer status"
      )
    },
  })
}
