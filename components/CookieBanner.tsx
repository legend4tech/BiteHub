"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Cookie, X } from "lucide-react"

export function CookieBanner() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false
    return !localStorage.getItem("cookie_consent")
  })

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true")
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed right-4 bottom-4 z-[99] max-w-sm rounded-xl border border-border bg-background p-4 shadow-xl transition-all duration-300 sm:right-6 sm:bottom-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 font-heading font-semibold text-foreground">
            <Cookie className="size-4 text-primary" />
            We use cookies
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            We use basic cookies to keep BiteHub running smoothly and analyze
            traffic. By using our site, you agree to our{" "}
            <Link
              href="/privacy"
              className="font-semibold text-primary underline hover:text-primary/80"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          onClick={acceptCookies}
          className="w-full bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          Got it
        </Button>
      </div>
    </div>
  )
}
