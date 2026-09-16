import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { Feedback } from "@/types/vendor"

export function useVendorFeedback(enabled: boolean = true) {
  return useQuery<Feedback[]>({
    queryKey: ["vendor-feedback"],
    queryFn: async () => {
      const res = await apiClient.get("/vendor/feedback")
      return Array.isArray(res.data) ? res.data : []
    },
    enabled,
  })
}
