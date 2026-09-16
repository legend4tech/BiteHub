/**
 * useSubmitFeedback.ts
 *
 * Mutation hook for submitting platform and vendor feedback.
 * Used by FeedbackModal and PlatformFeedbackModal.
 */
import { useMutation } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { SubmitFeedbackPayload } from "@/types/shared"

async function submitFeedback(payload: SubmitFeedbackPayload) {
  const res = await apiClient.post("/feedback", payload)
  return res.data
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: submitFeedback,
  })
}
