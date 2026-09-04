import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface DeliveryZone {
  id: string
  name: string
  fee: number
  subLandmarks: { id: string; name: string; fee: number }[]
}

export function useVendorDeliveryZones(vendorId: string | undefined | null) {
  return useQuery<DeliveryZone[]>({
    queryKey: ["vendor-delivery-zones", vendorId],
    queryFn: () =>
      apiClient
        .get(`/vendors/${vendorId}/delivery-zones`)
        .then((res) => res.data),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
  })
}
