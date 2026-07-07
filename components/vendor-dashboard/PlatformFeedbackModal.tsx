"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { APP_NAME } from "@/lib/constants"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface PlatformFeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId?: string
}

export function PlatformFeedbackModal({
  open,
  onOpenChange,
  vendorId,
}: PlatformFeedbackModalProps) {
  const [platformRating, setPlatformRating] = useState(0)
  const [platformComments, setPlatformComments] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-xl font-bold">
            Rate the Platform
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            How was your experience using {APP_NAME} as a vendor? We&apos;d love
            to hear your thoughts!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setPlatformRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-6 transition-colors ${
                      (hoveredRating || platformRating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Comments <span className="text-destructive">*</span>
            </label>
            <textarea
              value={platformComments}
              onChange={(e) => setPlatformComments(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              rows={4}
              placeholder="Tell us what you liked or what we can improve (required, min 3 chars)..."
            />
          </div>
        </div>

        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
          <AlertDialogCancel
            onClick={() => {
              const snoozeTime = new Date().getTime() + 5 * 24 * 60 * 60 * 1000 // 5 days
              localStorage.setItem(
                "vendor_feedback_snoozed",
                snoozeTime.toString()
              )
              onOpenChange(false)
            }}
            className="w-full sm:w-auto"
          >
            Maybe later
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              try {
                const response = await fetch("/api/feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    vendorId,
                    platform: {
                      rating: platformRating,
                      comments: platformComments,
                    },
                  }),
                })

                if (response.ok) {
                  toast.success("Feedback submitted! Thank you.")
                  localStorage.setItem("vendor_feedback_submitted", "true")
                  onOpenChange(false)
                  setPlatformRating(0)
                  setPlatformComments("")
                } else {
                  toast.error(
                    "Couldn't submit your feedback. Please try again."
                  )
                }
              } catch {
                toast.error("Something went wrong. Please try again.")
              }
            }}
            disabled={
              platformRating === 0 || platformComments.trim().length < 3
            }
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            Submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
