import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import { VendorDeliverySettingsUpdateValues } from "@/lib/schemas"

export interface DeliverySettingsResponse {
  landmarks: {
    id: string
    school: string
    campus: string
    name: string
    defaultDeliveryFee: number
    subLandmarks: {
      id: string
      name: string
      defaultDeliveryFee?: number
    }[]
  }[]
  overrides: {
    landmarks: { landmarkId: string; fee: number }[]
    subLandmarks: { subLandmarkId: string; fee: number }[]
  }
}

export function useVendorDeliverySettings() {
  const queryClient = useQueryClient()

  const query = useQuery<DeliverySettingsResponse>({
    queryKey: ["vendor-delivery-settings"],
    queryFn: async () => {
      const res = await apiClient.get("/vendor/delivery-settings")
      return res.data
    },
    refetchOnWindowFocus: false,
  })

  const saveMutation = useMutation({
    mutationFn: async (data: VendorDeliverySettingsUpdateValues) => {
      const res = await apiClient.put("/vendor/delivery-settings", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-delivery-settings"] })
    },
  })

  return {
    ...query,
    saveMutation,
  }
}
