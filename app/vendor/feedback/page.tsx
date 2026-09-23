"use client"

import { useSession } from "next-auth/react"
import { useVendorFeedback } from "@/hooks/vendor/useVendorFeedback"
import type { Feedback } from "@/types/vendor"
import { EmptyState } from "@/components/shared/EmptyState"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import { FetchError } from "@/components/shared/FetchError"
import { Star } from "lucide-react"

export default function VendorFeedbackPage() {
  const { data: session, status } = useSession()
  const isReady = !!session?.user

  const {
    data: feedbacks = [],
    isPending: loadingFeedback,
    isError,
    refetch,
  } = useVendorFeedback(isReady)

  const isLoadingAny = status === "loading" || loadingFeedback

  const now = new Date()
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening"

  return (
    <SectionErrorBoundary title="Couldn't load feedback">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {greeting},
            </p>
            <h1 className="mt-0.5 font-heading text-2xl font-bold md:text-3xl">
              Customer Feedback
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              What customers are saying about your order and service
            </p>
          </div>
        </div>

        {/* Feedback List */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="p-5">
            {isLoadingAny ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl bg-muted/50"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="py-6">
                <FetchError
                  title="Couldn't load feedback"
                  onRetry={() => refetch()}
                  size="sm"
                />
              </div>
            ) : feedbacks.length === 0 ? (
              <EmptyState
                size="sm"
                title="No feedback yet"
                description="When customers leave feedback, it will appear here."
              />
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback: Feedback) => (
                  <div
                    key={feedback.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                          Vendor Service
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`service-${star}`}
                              className={`size-3.5 ${feedback.rating >= star ? "fill-rating text-warning" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Item Reviews */}
                    {feedback.itemReviews &&
                      feedback.itemReviews.length > 0 && (
                        <div className="mt-2 flex flex-col gap-3">
                          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Ordered Items
                          </span>
                          {feedback.itemReviews.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-border/50 bg-card p-3 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">
                                  {item.menuItemName}
                                </span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={`item-${item.id}-${star}`}
                                      className={`size-3 ${item.rating >= star ? "fill-rating text-warning" : "text-muted-foreground"}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {item.title && (
                                <p className="mt-2 text-sm font-medium">
                                  {item.title}
                                </p>
                              )}
                              {item.comments && (
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                  {item.comments}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    {feedback.isAnonymous ? (
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Anonymous Review
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        Order: {feedback.orderId}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  )
}
