import { useMutation } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { ValidatePromoCodeInput } from "@/lib/schemas"
import type { ValidatePromoCodeResult } from "@/types/promo"

export function useValidatePromoCode() {
  return useMutation({
    mutationFn: async (
      payload: ValidatePromoCodeInput
    ): Promise<ValidatePromoCodeResult> => {
      const response = await apiClient.post("/customer/promo/validate", payload)
      return response.data
    },
  })
}
