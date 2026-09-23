import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type {
  CustomerReviewOrder,
  CustomerReviewRecord,
} from "@/types/customer"
import type { FeedbackValues } from "@/lib/schemas"

export type ReviewData = {
  success: boolean
  pending: CustomerReviewOrder[]
  completedWithVendor: CustomerReviewRecord[]
}

export function useCustomerReviews(tab: string) {
  return useQuery<ReviewData>({
    queryKey: ["customer-reviews", tab],
    queryFn: async () => {
      const response = await apiClient.get(`/customer/reviews?tab=${tab}`)
      return response.data
    },
  })
}

export function useCustomerOrder(orderId: string) {
  return useQuery<CustomerReviewOrder>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${orderId}`)
      return response.data
    },
    enabled: !!orderId,
  })
}

export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: FeedbackValues) => {
      const response = await apiClient.post("/feedback", payload)
      return response.data
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["customer-reviews"] })

      // Optimistically update the specific order cache to prevent UI flicker
      queryClient.setQueryData(
        ["order", payload.orderId],
        (
          oldData: { isVendorRated: boolean; ratedItems: string[] } | undefined
        ) => {
          if (!oldData) return oldData

          const isVendorRated =
            (payload.customerReview?.vendorRating || 0) > 0
              ? true
              : oldData.isVendorRated

          const newRatedItems = [...(oldData.ratedItems || [])]
          if (payload.customerReview?.itemReviews) {
            payload.customerReview.itemReviews.forEach((item) => {
              if (!newRatedItems.includes(item.menuItemId)) {
                newRatedItems.push(item.menuItemId)
              }
            })
          }

          return {
            ...oldData,
            isVendorRated,
            ratedItems: newRatedItems,
          }
        }
      )

      // Also invalidate it so it refetches in the background to sync with the server
      queryClient.invalidateQueries({ queryKey: ["order", payload.orderId] })
    },
  })
}
