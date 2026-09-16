import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export function useCustomerWallet() {
  return useQuery({
    queryKey: ["customer-wallet"],
    queryFn: async () => {
      const response = await apiClient.get("/customer/wallet")
      return response.data
    },
  })
}
