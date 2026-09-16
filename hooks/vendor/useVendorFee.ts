import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { VendorFeeResponse } from "@/types/vendor"

export function useVendorFee(vendorId: string | undefined | null) {
  return useQuery<VendorFeeResponse>({
    queryKey: ["vendor-fee", vendorId],
    queryFn: () =>
      apiClient.get(`/vendors/fee/${vendorId}`).then((res) => res.data),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
  })
}
