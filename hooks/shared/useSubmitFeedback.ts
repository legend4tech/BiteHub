/**
 * useSubmitFeedback.ts
 *
 * Mutation hook for submitting platform and vendor feedback.
 * Used by FeedbackModal and PlatformFeedbackModal.
 */
import { useMutation } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface SubmitFeedbackPayload {
  orderId?: string
  vendorId?: string
  platform?: {
    rating: number
    comments?: string
  }
  vendor?: {
    vendorId: string
    rating: number
    comments?: string
    isAnonymous?: boolean
  }
}

async function submitFeedback(payload: SubmitFeedbackPayload) {
  const res = await apiClient.post("/feedback", payload)
  return res.data
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: submitFeedback,
  })
}
