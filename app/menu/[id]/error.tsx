"use client"

import { useEffect } from "react"
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
  useEffect(() => {
    console.error("[MenuError]", error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <FetchError
          size="lg"
          title="Failed to load menu item"
          message="We couldn't load this menu item. Please try again later."
          onRetry={reset}
          onBack="/menus"
        />
      </div>
      <Footer />
    </main>
  )
}
