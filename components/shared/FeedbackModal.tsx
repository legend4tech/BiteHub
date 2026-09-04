"use client"

import { useState } from "react"
import { type AxiosError } from "axios"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants"
import { toast } from "sonner"
import { useSubmitFeedback } from "@/hooks/shared/useSubmitFeedback"

export const FEEDBACK_SNOOZE_DURATION = 24 * 60 * 60 * 1000 // 24 hours (easily editable)

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  vendorName: string
  vendorId: string
}

export function FeedbackModal({
  open,
  onOpenChange,
  orderId,
  vendorName,
  vendorId,
}: FeedbackModalProps) {
  const [platformRating, setPlatformRating] = useState(0)
  const [platformComments, setPlatformComments] = useState("")
  const [vendorRating, setVendorRating] = useState(0)
  const [vendorComments, setVendorComments] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedbackStep, setFeedbackStep] = useState(1)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const submitFeedback = useSubmitFeedback()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[28px] sm:max-w-[550px]">
        <AlertDialogHeader>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase">
              Step {feedbackStep} of 2
            </span>
          </div>
          <AlertDialogTitle className="font-heading text-xl font-bold">
            {feedbackStep === 1 ? "Rate the Platform" : "Rate the Vendor"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {feedbackStep === 1
              ? `How was your experience using ${APP_NAME}? We'd love to hear your thoughts!`
              : `How was your order and service from ${vendorName}?`}
          </AlertDialogDescription>

          {/* Progress Bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: feedbackStep === 1 ? "50%" : "100%" }}
            />
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    feedbackStep === 1
                      ? setPlatformRating(star)
                      : setVendorRating(star)
                  }
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-7 transition-colors ${
                      (hoveredRating ||
                        (feedbackStep === 1 ? platformRating : vendorRating)) >=
                      star
                        ? "fill-rating text-rating"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Comments <span className="text-destructive">*</span>
            </label>
            <textarea
              value={feedbackStep === 1 ? platformComments : vendorComments}
              onChange={(e) =>
                feedbackStep === 1
                  ? setPlatformComments(e.target.value)
                  : setVendorComments(e.target.value)
              }
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none"
              rows={4}
              placeholder={
                feedbackStep === 1
                  ? "Tell us what you liked or what we can improve (required, min 3 chars)..."
                  : "How was the food and service? (required, min 3 chars)..."
              }
            />
          </div>

          {feedbackStep === 2 && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="size-4 rounded border-border"
              />
              <label
                htmlFor="isAnonymous"
                className="text-sm text-muted-foreground select-none"
              >
                Submit review anonymously to the vendor
              </label>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col-reverse gap-3 sm:flex-row">
          {feedbackStep === 1 ? (
            <AlertDialogCancel
              onClick={() => {
                localStorage.setItem(
                  `feedback_snoozed_${orderId}`,
                  new Date().getTime().toString()
                )
                onOpenChange(false)
              }}
              className="w-full sm:w-auto"
            >
              Maybe later
            </AlertDialogCancel>
          ) : (
            <Button
              variant="outline"
              onClick={() => setFeedbackStep(1)}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
          )}

          {feedbackStep === 1 ? (
            <Button
              onClick={() => setFeedbackStep(2)}
              disabled={
                platformRating === 0 || platformComments.trim().length < 3
              }
              className="w-full sm:w-auto"
            >
              Next
            </Button>
          ) : (
            <AlertDialogAction
              onClick={() => {
                submitFeedback.mutate(
                  {
                    orderId,
                    platform: {
                      rating: platformRating,
                      comments: platformComments,
                    },
                    vendor: {
                      vendorId,
                      rating: vendorRating,
                      comments: vendorComments,
                      isAnonymous,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success("Feedback submitted! Thank you.")
                      localStorage.setItem(
                        `feedback_handled_${orderId}`,
                        "true"
                      )
                      onOpenChange(false)
                      window.location.reload()
                    },
                    onError: (error) => {
                      const err = error as AxiosError<{ error?: string }>
                      toast.error(
                        err?.response?.data?.error ||
                          "Couldn't submit your feedback. Please try again."
                      )
                    },
                  }
                )
              }}
              disabled={
                vendorRating === 0 ||
                vendorComments.trim().length < 3 ||
                submitFeedback.isPending
              }
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              Submit Feedback
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
