"use client"

import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { useMenuItemReviews } from "@/hooks/customer/useMenuItemReviews"
import { useEffect, useState } from "react"
import { ArrowLeft, Star, Loader2, UserCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

import { InfiniteScrollTrigger } from "@/components/shared/InfiniteScrollTrigger"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { RatingStatistics } from "@/components/public-vendors/RatingStatistics"
import {
  MenuItemReviewSkeleton,
  RatingStatisticsSkeleton,
} from "@/components/shared/skeletons/PublicSkeletons"

export default function MenuItemReviewsPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useMenuItemReviews(id, ratingFilter)

  const reviews = data?.pages.flatMap((page) => page.reviews) || []

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        <Button
          variant="ghost"
          className="mb-6 pl-0 hover:bg-transparent"
          onClick={() => router.push(`/menu/${id}`)}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Menu Item
        </Button>

        <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight">
          Item Reviews
        </h1>

        {data?.pages[0]?.statistics && (
          <RatingStatistics
            statistics={data.pages[0].statistics}
            activeFilter={ratingFilter}
            onFilterChange={setRatingFilter}
          />
        )}

        {ratingFilter && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filtering by</span>
              <div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">
                {ratingFilter}{" "}
                <Star className="size-3 fill-warning text-warning" />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRatingFilter(null)}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              Clear filter
              <X className="ml-1 size-4" />
            </Button>
          </div>
        )}

        {status === "pending" ? (
          <div>
            <RatingStatisticsSkeleton />
            <div className="space-y-6">
              <MenuItemReviewSkeleton />
              <MenuItemReviewSkeleton />
              <MenuItemReviewSkeleton />
              <MenuItemReviewSkeleton />
            </div>
          </div>
        ) : status === "error" ? (
          <FetchError
            title="Failed to load reviews"
            message="We encountered an error loading the reviews for this item."
            onRetry={() => refetch()}
            onBack={`/menu/${id}`}
            className="py-20"
          />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description={
              ratingFilter
                ? `There are no ${ratingFilter}-star reviews for this item yet.`
                : "This item hasn't received any reviews yet."
            }
            className="py-20"
            secondaryAction={
              ratingFilter
                ? {
                    label: "View all reviews",
                    onClick: () => setRatingFilter(null),
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {review.customerImage && !review.isAnonymous ? (
                      <Image
                        src={review.customerImage}
                        alt={review.customerName || "Customer"}
                        width={40}
                        height={40}
                        className="size-10 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserCircle2 className="size-6" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">
                        {review.isAnonymous
                          ? "Anonymous"
                          : review.customerName || "Customer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 rounded-full bg-warning/10 px-2.5 py-1 text-warning">
                    <span className="text-sm font-bold">{review.rating}</span>
                    <Star className="size-3.5 fill-warning" />
                  </div>
                </div>

                {(review.title || review.comments) && (
                  <div className="mt-4">
                    {review.title && (
                      <h4 className="font-semibold text-foreground">
                        {review.title}
                      </h4>
                    )}
                    {review.comments && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {review.comments}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Infinite loading trigger */}
            {(hasNextPage || isFetchingNextPage) && (
              <InfiniteScrollTrigger
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                loadingContent={
                  <div className="space-y-6 pt-6">
                    <MenuItemReviewSkeleton />
                    <MenuItemReviewSkeleton />
                  </div>
                }
                loadingText="Loading more reviews..."
                endText="You've reached the end of the reviews."
              />
            )}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
