import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import { VendorDeliverySettingsUpdateValues } from "@/lib/schemas"
import type { DeliverySettingsResponse } from "@/types/vendor"

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
