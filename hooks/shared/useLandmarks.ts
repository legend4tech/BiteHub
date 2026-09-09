import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface SystemLandmark {
  id: string
  name: string
  school: string
  campus: string
  defaultDeliveryFee: number
}

export function useSystemLandmarks(school: string, campus: string) {
  return useQuery<SystemLandmark[]>({
    queryKey: ["system-landmarks", school, campus],
    queryFn: () =>
      apiClient
        .get(`/landmarks?school=${school}&campus=${campus}`)
        .then((res) => res.data),
    enabled: !!school && !!campus,
    staleTime: 5 * 60 * 1000,
  })
}
