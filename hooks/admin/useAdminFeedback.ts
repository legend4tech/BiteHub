import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { Feedback } from "@/components/admin/AdminFeedback"

export function useAdminFeedback() {
  return useQuery<Feedback[]>({
    queryKey: ["admin-feedback"],
    queryFn: async () => (await apiClient.get("/admin/feedback")).data,
  })
}
