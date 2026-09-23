"use client"

import { useEffect, startTransition } from "react"
import { useRouter } from "next/navigation"
import { FetchError } from "@/components/shared/FetchError"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CustomerDashboardError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error("[CustomerDashboardError]", error)
  }, [error])

  const handleRetry = () => {
    startTransition(() => {
      router.refresh()
      reset()
    })
  }

  return (
    <div className="flex h-[80vh] items-center justify-center p-6">
      <FetchError
        size="md"
        title="Unable to load data"
        message="An error occurred while fetching your dashboard data. Please try again."
        onRetry={handleRetry}
      />
    </div>
  )
}
