"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Star, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ORDER_STATUS_CONFIG } from "@/lib/constants"
import { formatDate, formatTime } from "@/lib/timeUtils"
import { useCustomerReviews } from "@/hooks/customer/useCustomerReviews"

export default function CustomerReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Reviews
            </h1>
            <p className="text-muted-foreground">
              Manage your past and pending reviews
            </p>
          </div>
          <PageSkeleton variant="customer-reviews" />
        </div>
      }
    >
      <CustomerReviewsContent />
    </Suspense>
  )
}

function CustomerReviewsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "pending"

  const { data, isLoading, isError, refetch } = useCustomerReviews(currentTab)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Reviews
          </h1>
          <p className="text-muted-foreground">
            Manage your past and pending reviews
          </p>
        </div>
        <PageSkeleton variant="customer-reviews" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <FetchError
        title="Failed to load reviews"
        message="Please try refreshing the page."
        onRetry={() => refetch()}
        className="py-20"
      />
    )
  }

  const pending = data.pending || []
  const completed = data.completedWithVendor || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Reviews
        </h1>
        <p className="text-muted-foreground">
          Manage your past and pending reviews
        </p>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(val) => router.replace(`${pathname}?tab=${val}`)}
        className="w-full"
      >
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending">
            To Review
            {pending.length > 0 && (
              <span className="ml-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Reviewed</TabsTrigger>
        </TabsList>

        <TabsContent
          value="pending"
          className="space-y-4 focus-visible:outline-none"
        >
          {pending.length === 0 ? (
            <EmptyState
              title="No pending reviews"
              description="You have reviewed all your completed orders. Order more food to leave new reviews!"
              className="py-12"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pending.map((order) => {
                const statusConfig =
                  ORDER_STATUS_CONFIG[
                    order.status as keyof typeof ORDER_STATUS_CONFIG
                  ] || ORDER_STATUS_CONFIG.completed
                return (
                  <div
                    key={order.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-border/50 bg-card/50 p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
                  >
                    {/* Background decoration */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />

                    <div>
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                          {formatDate(order.createdAt!)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <Avatar className="size-12 shrink-0 border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                          <AvatarImage
                            src={order.vendor?.image?.url}
                            alt={order.vendorName}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                            {order.vendorName?.substring(0, 2).toUpperCase() ||
                              "VN"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="line-clamp-1 font-heading text-lg leading-tight font-bold tracking-tight text-foreground">
                            {order.vendorName}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              ₦{order.totalAmount.toLocaleString()}
                            </span>
                            <span className="text-[10px] opacity-50">•</span>
                            <span>
                              {order.items.length} item
                              {order.items.length !== 1 && "s"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground/80">
                        <div className="flex items-center gap-2">
                          <Clock className="size-3.5 shrink-0" />
                          <span>Ordered at {formatTime(order.createdAt!)}</span>
                        </div>
                        <Link
                          href={`/order/${order.orderId}`}
                          className="font-mono text-[10px] font-semibold text-muted-foreground uppercase underline underline-offset-4 transition-colors hover:text-primary"
                          title="Track Order"
                        >
                          #{order.orderId.substring(0, 10)}
                        </Link>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-5 border-t border-border/30 pt-5">
                      <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={`${item.menuItemId}-${idx}`}
                            className="group/item relative shrink-0"
                          >
                            <Avatar className="size-8 border border-border/50 bg-accent/50 transition-colors group-hover/item:border-primary/30 group-hover/item:bg-primary/10">
                              <AvatarImage
                                src={item.image}
                                alt={item.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="text-[9px] font-medium text-foreground">
                                {item.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ))}
                        {order.items.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">
                            No items recorded
                          </span>
                        )}
                      </div>

                      <Button
                        asChild
                        className="w-full rounded-xl bg-primary px-6 font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
                      >
                        <Link href={`/customer/reviews/new/${order.orderId}`}>
                          <Star className="mr-2 size-4" />
                          Leave a Review
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="completed"
          className="space-y-4 focus-visible:outline-none"
        >
          {completed.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              description="You haven't submitted any reviews. Check the 'To Review' tab to get started!"
              className="py-12"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {completed.map((review) => (
                <div
                  key={review.id}
                  className="group relative overflow-hidden rounded-[24px] border border-border/50 bg-card/50 p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
                >
                  {/* Background decoration */}
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />

                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                      {formatDate(review.updatedAt!)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-success uppercase">
                      <Star className="size-3" />
                      Reviewed
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Avatar className="size-12 shrink-0 border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                      <AvatarImage
                        src={review.vendor?.image?.url}
                        alt={review.vendor?.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                        {review.vendor?.name?.substring(0, 2).toUpperCase() ||
                          "VN"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="line-clamp-1 font-heading text-lg leading-tight font-bold tracking-tight text-foreground">
                        {review.vendor?.name || "Unknown Vendor"}
                      </h3>
                      <div className="mt-1 flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i < review.rating
                                ? "fill-primary text-primary"
                                : "fill-muted text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {review.comments ? (
                    <div className="mt-5 rounded-xl bg-accent/30 p-3.5 text-sm text-muted-foreground italic">
                      &quot;{review.comments}&quot;
                    </div>
                  ) : (
                    <div className="mt-5 text-sm text-muted-foreground/50 italic">
                      No comments provided.
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-5 border-t border-border/30 pt-5">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/order/${review.orderId}`}
                        className="font-mono text-xs font-semibold text-muted-foreground uppercase underline underline-offset-4 transition-colors hover:text-primary"
                        title="Track Order"
                      >
                        #{review.orderId.substring(0, 10)}
                      </Link>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs font-semibold hover:text-primary"
                        asChild
                      >
                        <Link href={`/vendors/${review.vendor?.slug}`}>
                          View Vendor
                        </Link>
                      </Button>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-xl border-primary/20 bg-primary/5 font-semibold text-primary transition-all hover:bg-primary/10 hover:text-primary"
                    >
                      <Link href={`/customer/reviews/new/${review.orderId}`}>
                        View My Reviews
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
