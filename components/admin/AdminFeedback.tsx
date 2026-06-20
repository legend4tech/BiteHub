"use client"

import { Star } from "lucide-react"
import { APP_NAME } from "@/lib/constants"
import { EmptyState } from "@/components/shared/EmptyState"

export interface Feedback {
  _id: string
  rating: number
  comments?: string
  orderId?: string
  vendorId?: string
  createdAt: string
}

interface AdminFeedbackProps {
  feedbacks: Feedback[] | undefined
  loadingFeedback: boolean
}

export function AdminFeedback({
  feedbacks,
  loadingFeedback,
}: AdminFeedbackProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Platform Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What users are saying about {APP_NAME}
        </p>
      </div>

      <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
        {loadingFeedback ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-muted/50"
              />
            ))}
          </div>
        ) : feedbacks?.length === 0 ? (
          <EmptyState
            size="sm"
            title="No feedback received yet"
            description="When users submit platform feedback, it will show up here."
          />
        ) : (
          <div className="space-y-4">
            {feedbacks?.map((feedback) => (
              <div
                key={feedback._id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-4 ${feedback.rating >= star ? "fill-rating text-rating" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {feedback.comments && (
                  <p className="text-sm leading-relaxed text-foreground">
                    {feedback.comments}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {feedback.orderId && (
                    <span>
                      Order:{" "}
                      <span className="font-mono text-primary">
                        {feedback.orderId}
                      </span>
                    </span>
                  )}
                  {feedback.vendorId && (
                    <span>
                      · Vendor:{" "}
                      <span className="font-mono">{feedback.vendorId}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
