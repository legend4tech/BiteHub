"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Store, Star } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { EmptyState } from "@/components/shared/EmptyState"

import { ORDER_STATUS } from "@/lib/constants"
import { useCustomerOrder } from "@/hooks/customer/useCustomerReviews"
import { formatDate } from "@/lib/timeUtils"

import { VendorReviewForm } from "@/components/customer/reviews/VendorReviewForm"
import { ItemReviewForm } from "@/components/customer/reviews/ItemReviewForm"

export default function WriteReviewPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()

  const { data: order, isLoading, isError, refetch } = useCustomerOrder(orderId)

  // Track the index of the item being reviewed (-1 means none)
  const [currentlyReviewing, setCurrentlyReviewing] = useState<number>(-1)

  if (isLoading) {
    return <PageSkeleton variant="customer-review-new" />
  }

  if (isError || !order) {
    return (
      <FetchError
        title="Order Not Found"
        message="We couldn't find this order."
        onRetry={() => refetch()}
        onBack="/customer/reviews"
        className="py-20"
      />
    )
  }

  if (order.status !== ORDER_STATUS.COMPLETED) {
    return (
      <EmptyState
        title="Order Not Completed"
        description="You can only review orders that have been completed."
        icon={<Store className="size-8 text-muted-foreground/50" />}
        action={{
          label: "Track Order",
          href: `/order/${orderId}`,
        }}
        className="py-20"
      />
    )
  }

  // Separate unrated items and rated items
  const unratedItems =
    order.items?.filter(
      (item: { menuItemId: string }) =>
        !order.ratedItems?.includes(item.menuItemId)
    ) || []

  const ratedItems =
    order.items?.filter((item: { menuItemId: string }) =>
      order.ratedItems?.includes(item.menuItemId)
    ) || []

  const handleVendorSuccess = () => {
    // Reset accordion
    setCurrentlyReviewing(-1)
  }

  const handleItemSuccess = () => {
    // Reset accordion
    setCurrentlyReviewing(-1)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/customer/reviews">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Write a Review
          </h1>
          <p className="text-muted-foreground">
            Order #{orderId.substring(0, 8)} • {order.vendorName}
          </p>
        </div>
      </div>

      {!order.isVendorRated ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Please rate the vendor first to unlock item reviews.
            </p>
          </div>
          <VendorReviewForm order={order} onSuccess={handleVendorSuccess} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Vendor rating submitted! You can now rate your items.
            </p>
          </div>

          <h2 className="font-heading text-xl font-bold tracking-tight">
            Rate your items
          </h2>

          <div className="space-y-4">
            {unratedItems.map((item, index) => (
              <ItemReviewForm
                key={item.menuItemId}
                order={order}
                orderItem={item}
                isExpanded={currentlyReviewing === index}
                onToggleExpand={() =>
                  setCurrentlyReviewing(
                    currentlyReviewing === index ? -1 : index
                  )
                }
                onSuccess={handleItemSuccess}
              />
            ))}
          </div>

          {unratedItems.length === 0 && ratedItems.length === 0 && (
            <EmptyState
              title="No Items"
              description="There are no items in this order to review."
              className="py-10"
            />
          )}

          {ratedItems.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight">
                Reviewed Items
              </h2>
              {ratedItems.map((item) => {
                const review = order.existingItemReviews?.find(
                  (r) => r.menuItemId === item.menuItemId
                )

                return (
                  <div
                    key={item.menuItemId}
                    className="rounded-[24px] border border-border bg-card p-6 shadow-sm sm:p-8"
                  >
                    <div className="flex items-start justify-between border-b border-border pb-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || "Menu Item"}
                            className="size-12 shrink-0 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <span className="font-bold text-primary">
                              {item.name?.substring(0, 2).toUpperCase() || "IT"}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
                            {item.name || "Menu Item"}
                          </h3>
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <span>Qty: {item.quantity || 1}</span>
                            {review?.createdAt && (
                              <span className="border-l border-border pl-3 opacity-50">
                                Reviewed on {formatDate(review.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1.5">
                        <span className="text-sm font-bold text-warning">
                          {review?.rating || 0}
                        </span>
                        <Star className="size-4 fill-warning text-warning" />
                      </div>
                    </div>

                    {(review?.title || review?.comments) && (
                      <div className="mt-4 space-y-2">
                        {review.title && (
                          <h4 className="font-semibold text-foreground">
                            {review.title}
                          </h4>
                        )}
                        {review.comments && (
                          <p className="text-sm text-muted-foreground italic">
                            &quot;{review.comments}&quot;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
