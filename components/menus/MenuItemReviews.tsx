import { Star, User, MessageSquareOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { EmptyState } from "@/components/shared/EmptyState"

interface Review {
  id: string
  rating: number
  title: string
  comments?: string
  isAnonymous?: boolean
  createdAt: string
  customer: { name: string; image?: { url: string } } | null
}

interface MenuItemReviewsProps {
  reviews: Review[]
}

export function MenuItemReviews({ reviews }: MenuItemReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="mt-20">
        <h2 className="mb-8 font-heading text-2xl font-bold">
          Reviews & Ratings
        </h2>
        <EmptyState
          icon={<MessageSquareOff className="size-10 text-muted-foreground" />}
          title="No reviews yet"
          description="Be the first to leave a review for this item!"
          showImage={false}
        />
      </div>
    )
  }

  return (
    <div className="mt-20">
      <h2 className="mb-8 font-heading text-2xl font-bold">
        Reviews & Ratings
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {review.customer?.image?.url ? (
                    <Image
                      src={review.customer.image.url}
                      alt={review.customer.name}
                      width={40}
                      height={40}
                      className="size-full object-cover"
                    />
                  ) : (
                    <User className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {review.isAnonymous || !review.customer
                      ? "Anonymous Customer"
                      : review.customer.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.createdAt
                      ? formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                        })
                      : "Recently"}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-4 ${
                      star <= review.rating
                        ? "fill-warning text-warning"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-1 font-bold text-foreground">{review.title}</h3>
              {review.comments && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.comments}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
