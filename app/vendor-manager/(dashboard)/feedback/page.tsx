"use client"

import { useAdminFeedback } from "@/hooks/queries/useAdminFeedback"
import { VendorManagerFeedback } from "@/components/vendor-manager/VendorManagerFeedback"
import { FetchError } from "@/components/shared/FetchError"

export default function VendorManagerFeedbackPage() {
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
    <VendorManagerFeedback
      feedbacks={feedbacks}
      loadingFeedback={loadingFeedback}
    />
  )
}
