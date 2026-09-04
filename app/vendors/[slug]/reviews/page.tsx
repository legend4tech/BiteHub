"use client"

import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { useVendorReviews } from "@/hooks/vendor/useVendorReviews"
import { useInView } from "react-intersection-observer"
import { useEffect, useState } from "react"
import { ArrowLeft, Star, Loader2, UserCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { RatingStatistics } from "@/components/public-vendors/RatingStatistics"

export default function VendorReviewsPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()

  const { ref, inView } = useInView()

  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useVendorReviews(slug, ratingFilter)

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

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
          onClick={() => router.push(`/vendors/${slug}`)}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Menu
        </Button>

        <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight">
          Customer Reviews
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
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {ratingFilter}{" "}
                <Star className="size-3 fill-primary text-primary" />
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
          <PageSkeleton variant="vendor-detail" />
        ) : status === "error" ? (
          <FetchError
            title="Failed to load reviews"
            message="We encountered an error loading the customer reviews for this vendor."
            onRetry={() => refetch()}
            onBack={`/vendors/${slug}`}
            className="py-20"
          />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="This vendor doesn't have any customer reviews yet. Check back later!"
            className="rounded-3xl border border-border py-20"
          />
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md sm:p-8"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <UserCircle2 className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {review.customerName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-fit items-center gap-1 rounded-full bg-rating/10 px-3 py-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-4 ${
                          review.rating >= star
                            ? "fill-rating text-rating"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {review.comments && (
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                    &quot;{review.comments}&quot;
                  </p>
                )}
              </div>
            ))}

            {/* Infinite loading trigger */}
            <div
              ref={ref}
              className="flex w-full items-center justify-center py-8"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  Loading more reviews...
                </div>
              ) : hasNextPage ? (
                <div className="h-4 w-4" /> // Empty placeholder for intersection observer
              ) : (
                <p className="text-sm text-muted-foreground">
                  You&apos;ve reached the end of the reviews.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
