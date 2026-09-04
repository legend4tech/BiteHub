"use client"

import { useAdminFeedback } from "@/hooks/admin/useAdminFeedback"
import { AdminFeedback } from "@/components/admin/AdminFeedback"
import { FetchError } from "@/components/shared/FetchError"

export default function AdminFeedbackPage() {
  const {
    data: feedbacks,
    isLoading: loadingFeedback,
    isError: isFeedbackError,
    refetch: refetchFeedback,
  } = useAdminFeedback()

  if (isFeedbackError) {
    return (
      <FetchError
        title="Couldn't load feedback"
        onRetry={() => refetchFeedback()}
      />
    )
  }

  return (
    <AdminFeedback feedbacks={feedbacks} loadingFeedback={loadingFeedback} />
  )
}
