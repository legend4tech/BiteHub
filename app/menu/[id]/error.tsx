"use client"

import { useEffect, startTransition } from "react"
import { useRouter } from "next/navigation"
import { FetchError } from "@/components/shared/FetchError"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export default function MenuError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[MenuError]", error)
  }, [error])

  const handleRetry = () => {
    startTransition(() => {
      router.refresh()
      reset()
    })
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <FetchError
          size="lg"
          title="Failed to load menu item"
          message="We couldn't load this menu item. Please try again later."
          onRetry={handleRetry}
          onBack="/menus"
        />
      </div>
      <Footer />
    </main>
  )
}
