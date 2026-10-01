import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export function useCustomerProgress() {
  return useQuery({
    queryKey: ["customer-gamification-progress"],
    queryFn: async () => {
      const response = await apiClient.get("/customer/gamification/progress")
      return response.data
    },
  })
}
