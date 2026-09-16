import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import { AdminLandmarkValues, AdminSubLandmarkValues } from "@/lib/schemas"
import type { SubLandmark, Landmark } from "@/types/admin"

export function useAdminDeliveryZones() {
  const queryClient = useQueryClient()

  const query = useQuery<Landmark[]>({
    queryKey: ["admin-landmarks"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/delivery-zones/landmarks")
      return res.data
    },
  })

  const saveLandmarkMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id?: string
      data: AdminLandmarkValues
    }) => {
      if (id) {
        return apiClient.put(`/admin/delivery-zones/landmarks/${id}`, data)
      } else {
        return apiClient.post("/admin/delivery-zones/landmarks", data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-landmarks"] })
    },
  })

  const deleteLandmarkMutation = useMutation({
    mutationFn: async (id: string) =>
      apiClient.delete(`/admin/delivery-zones/landmarks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-landmarks"] })
    },
  })

  const saveSubLandmarkMutation = useMutation({
    mutationFn: async (data: AdminSubLandmarkValues) => {
      return apiClient.post("/admin/delivery-zones/sub-landmarks", data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-landmarks"] })
    },
  })

  const deleteSubLandmarkMutation = useMutation({
    mutationFn: async (id: string) =>
      apiClient.delete(`/admin/delivery-zones/sub-landmarks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-landmarks"] })
    },
  })

  return {
    ...query,
    saveLandmarkMutation,
    deleteLandmarkMutation,
    saveSubLandmarkMutation,
    deleteSubLandmarkMutation,
  }
}
