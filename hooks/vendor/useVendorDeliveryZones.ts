import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { DeliveryZone, DeliveryZonesResponse } from "@/types/vendor"

export function useVendorDeliveryZones(vendorId: string | undefined | null) {
  const query = useQuery<DeliveryZonesResponse>({
    queryKey: ["vendor-delivery-zones", vendorId],
    queryFn: () =>
      apiClient
        .get(`/vendors/${vendorId}/delivery-zones`)
        .then((res) => res.data),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
  })

  const zones: DeliveryZone[] = query.data?.zones ?? []
  const vendorCampus: string = query.data?.vendorCampus ?? ""
  const vendorSchool: string = query.data?.vendorSchool ?? ""

  return { ...query, zones, vendorCampus, vendorSchool }
}
