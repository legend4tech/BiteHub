"use client"

import { useEffect, startTransition } from "react"
import { useRouter } from "next/navigation"
import { FetchError } from "@/components/shared/FetchError"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Last-resort boundary — only fires if an error escapes all SectionErrorBoundaries
// (e.g. an error in the layout itself or a completely unexpected crash).
export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  const handleRetry = () => {
    startTransition(() => {
      router.refresh()
      reset()
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <FetchError
        size="lg"
        title="Something went wrong"
        message="An unexpected error occurred. Please try reloading the page."
        onRetry={handleRetry}
        onBack="/"
      />
    </div>
  )
}
