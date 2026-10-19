"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Mail, Sparkles, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const STORAGE_KEY = "bitehub_newsletter_x_dismissed"
const SUBSCRIBED_KEY = "bitehub_newsletter_subscribed"
const LEGACY_STORAGE_KEY = "bitehub_newsletter_modal_dismissed"
const SCROLL_THRESHOLD = 300

type SubmitStatus = "idle" | "submitting" | "success" | "already-subscribed"

export function SubscribeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle")
  const hasTriggeredRef = useRef(false)

  // Check if visitor has already dismissed via X or already subscribed
  const isSuppressed = () => {
    try {
      return (
        localStorage.getItem(SUBSCRIBED_KEY) === "true" ||
        localStorage.getItem(STORAGE_KEY) === "true"
      )
    } catch {
      return false
    }
  }

  // Lightweight scroll trigger
  useEffect(() => {
    try {
      // Clean up legacy key from earlier testing so user isn't blocked
      localStorage.removeItem(LEGACY_STORAGE_KEY)

      if (isSuppressed()) {
        hasTriggeredRef.current = true
        return
      }
    } catch {
      return
    }

    const handleScroll = () => {
      if (hasTriggeredRef.current) return
      if (isSuppressed()) {
        hasTriggeredRef.current = true
        return
      }

      if (window.scrollY >= SCROLL_THRESHOLD) {
        hasTriggeredRef.current = true
        setIsOpen(true)
        window.removeEventListener("scroll", handleScroll)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Backdrop or Escape dismiss: closes modal without saving to localStorage
  const handleOpenChange = (open: boolean) => {
    if (submitStatus === "submitting") return
    setIsOpen(open)
    if (!open) {
      setSubmitStatus("idle")
    }
  }

  // Explicit "X" button click: dismisses and permanently persists to localStorage
  const handleDismissWithX = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {}
    setIsOpen(false)
    setSubmitStatus("idle")
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || submitStatus === "submitting") return

    setSubmitStatus("submitting")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to subscribe")

      // Permanently lock out modal for subscribed users so we don't disturb them again
      try {
        localStorage.setItem(SUBSCRIBED_KEY, "true")
        localStorage.setItem(STORAGE_KEY, "true")
      } catch {}

      if (data.alreadySubscribed) {
        setSubmitStatus("already-subscribed")
        toast.info("You are already subscribed to our updates.", {
          action: {
            label: "Unsubscribe",
            onClick: () => window.location.assign(data.unsubscribeUrl),
          },
          duration: 5000,
        })
        setTimeout(() => {
          setIsOpen(false)
          setSubmitStatus("idle")
        }, 1200)
      } else {
        setSubmitStatus("success")
        toast.success("Subscribed successfully! Welcome to BiteHub updates.")
        setTimeout(() => {
          setEmail("")
          setIsOpen(false)
          setSubmitStatus("idle")
        }, 1200)
      }
    } catch (err: unknown) {
      setSubmitStatus("idle")
      toast.error(err instanceof Error ? err.message : "An error occurred")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/80 backdrop-blur-md"
        className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl sm:max-w-[440px] sm:p-8"
      >
        <div className="relative">
          {/* Explicit "X" Close Button that persists dismissal to localStorage */}
          <button
            type="button"
            onClick={handleDismissWithX}
            disabled={submitStatus === "submitting"}
            aria-label="Close newsletter modal"
            className="absolute -top-2 -right-2 z-20 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none"
          >
            <X className="size-5" />
          </button>

          {/* Glow background accent */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Mascot icon badge */}
            <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-inner">
              <Image
                src="/avatars/mascot.png"
                alt="BiteHub Mascot"
                width={48}
                height={48}
                className="size-12 object-contain"
              />
              <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-white shadow-md">
                <Sparkles className="size-3.5" />
              </span>
            </div>

            <DialogHeader className="gap-1.5 text-center sm:text-center">
              <span className="inline-block text-xs font-bold tracking-wider text-primary uppercase">
                The Daily Bite
              </span>
              <DialogTitle className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Stay updated on BiteHub&apos;s latest news
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm font-medium text-muted-foreground">
                From brand-new kitchen launches and trending dish drops to
                surprise flash discounts and wallet rewards—get the freshest
                updates delivered straight to your inbox.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubscribe} className="mt-6 w-full space-y-3">
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitStatus !== "idle"}
                  required
                  placeholder="Enter your email address"
                  className="h-11 w-full rounded-xl border border-border bg-background pr-4 pl-10 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                />
              </div>

              <Button
                type="submit"
                disabled={submitStatus !== "idle"}
                className={`h-11 w-full rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-75 ${
                  submitStatus === "success"
                    ? "bg-emerald-600 text-white"
                    : submitStatus === "already-subscribed"
                      ? "bg-primary text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {submitStatus === "submitting" && (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Subscribing...
                  </>
                )}
                {submitStatus === "success" && (
                  <>
                    <Sparkles className="mr-2 size-4" />
                    You&apos;re in!
                  </>
                )}
                {submitStatus === "already-subscribed" && (
                  <>
                    <Check className="mr-2 size-4" />
                    Already Subscribed
                  </>
                )}
                {submitStatus === "idle" && "Keep Me in the Loop"}
              </Button>

              <p className="pt-1 text-center text-xs text-muted-foreground">
                No spam ever. Unsubscribe at any time with one click.
              </p>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
