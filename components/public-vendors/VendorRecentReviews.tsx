import Link from "next/link"
import { Star, UserCircle2, ArrowRight } from "lucide-react"
import type { VendorReview } from "@/lib/types"

interface VendorRecentReviewsProps {
  reviews: VendorReview[]
  vendorSlug: string
  totalReviews?: number
}

export function VendorRecentReviews({
  reviews,
  vendorSlug,
  totalReviews,
}: VendorRecentReviewsProps) {
  if (!reviews || reviews.length === 0) return null

  // Display a maximum of 4 reviews to keep the page clean
  const displayReviews = reviews.slice(0, 4)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="mb-10 flex flex-col">
      <div className="mb-6 px-1">
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Recent Ratings
        </h2>
      </div>

      {/* Grid container: 1 column on mobile, 2 columns on larger screens */}
      <div className="grid gap-4 sm:grid-cols-2">
        {displayReviews.map((review) => (
          <div
            key={review.id}
            className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <UserCircle2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="line-clamp-1 text-sm font-semibold">
                      {review.customerName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {review.createdAt ? formatDate(review.createdAt) : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-3.5 ${
                        review.rating >= star
                          ? "fill-rating text-rating"
                          : "text-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {review.comments && (
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground italic">
                  &quot;{review.comments}&quot;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Big prominent button at the bottom */}
      {totalReviews !== undefined && totalReviews > displayReviews.length && (
        <div className="mt-8 flex justify-center px-1">
          <Link
            href={`/vendors/${vendorSlug}/reviews`}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary/10 px-8 py-4 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground sm:w-auto sm:px-10"
          >
            Read all {totalReviews} ratings
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  )
}
