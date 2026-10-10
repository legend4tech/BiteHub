"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !email || !token ? "error" : "loading"
  )

  useEffect(() => {
    if (!email || !token) {
      return
    }

    fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success")
        } else {
          setStatus("error")
        }
      })
      .catch(() => setStatus("error"))
  }, [email, token])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Background decorations */}
      <div className="pointer-events-none absolute top-0 left-0 -mt-20 -ml-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 -mr-20 -mb-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="z-10 w-full max-w-[440px]">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href="/"
            className="mb-6 flex items-center gap-2 transition-transform hover:scale-105"
          >
            <Image
              src={APP_LOGO_URL}
              alt={APP_NAME}
              width={40}
              height={40}
              className="h-10 w-auto rounded-lg object-contain"
            />
            <span className="font-heading text-2xl font-black tracking-tight text-foreground">
              Bite<span className="text-primary">Hub</span>
            </span>
          </Link>
        </div>

        {/* Status Card */}
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-xl shadow-primary/5">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <Loader2 className="size-10 animate-spin text-primary" />
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Processing...
              </h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we update your preferences.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-success/10">
                <CheckCircle2 className="size-6 text-success" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Unsubscribed successfully
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                You will no longer receive marketing emails from {APP_NAME}.
                <br />
                <br />
                <span className="text-xs opacity-80">
                  (If you have a registered account, you will still receive
                  essential transactional emails like order receipts or password
                  resets.)
                </span>
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
                <XCircle className="size-6 text-destructive" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Link Invalid or Expired
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We couldn&apos;t process your unsubscribe request. The link you
                clicked may be invalid or expired.
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 active:scale-95"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          Loading...
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  )
}
