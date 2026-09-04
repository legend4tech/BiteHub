import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { CustomerProfile } from "./useCustomerProfile"

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<CustomerProfile>) => {
      const res = await apiClient.patch("/customer/me", data)
      return res.data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["customer-profile"] })
    },
  })
}
