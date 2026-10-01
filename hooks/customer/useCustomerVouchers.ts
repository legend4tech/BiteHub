import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export function useCustomerVouchers() {
  return useQuery({
    queryKey: ["customer-vouchers"],
    queryFn: async () => {
      const response = await apiClient.get("/customer/gamification/vouchers")
      return response.data.vouchers
    },
  })
}

export function useApplyVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await apiClient.post(
        "/customer/gamification/vouchers/apply",
        { code }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-vouchers"] })
    },
  })
}
