"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { Star, ChevronLeft, Loader2, Utensils, Store } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { EmptyState } from "@/components/shared/EmptyState"
import type { AxiosError } from "axios"
import { ORDER_STATUS } from "@/lib/constants"
import {
  useCustomerOrder,
  useSubmitReview,
} from "@/hooks/customer/useCustomerReviews"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldError } from "@/components/ui/field"
import {
  customerReviewFormSchema,
  type CustomerReviewFormValues,
} from "@/lib/schemas/customer"
import type { FieldErrors } from "react-hook-form"

export default function WriteReviewPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()

  const [hoveredVendorRating, setHoveredVendorRating] = useState(0)
  const [hoveredItemRatings, setHoveredItemRatings] = useState<
    Record<number, number>
  >({})

  const { data: order, isLoading, isError, refetch } = useCustomerOrder(orderId)

  const submitReview = useSubmitReview()

  const { control, handleSubmit, reset } = useForm<CustomerReviewFormValues>({
    resolver: zodResolver(customerReviewFormSchema),
    defaultValues: { vendorRating: 0, isAnonymous: false, itemReviews: [] },
  })

  const { fields } = useFieldArray({
    control,
    name: "itemReviews",
  })

  useEffect(() => {
    if (order && order.items && fields.length === 0) {
      reset({
        vendorRating: 0,
        isAnonymous: false,
        itemReviews: order.items.map((item: { menuItemId: string }) => ({
          menuItemId: item.menuItemId,
          rating: 0,
          title: "",
          comments: "",
        })),
      })
    }
  }, [order, reset, fields.length])

  const onSubmit = (data: CustomerReviewFormValues) => {
    submitReview.mutate(
      {
        orderId,
        customerReview: {
          orderId,
          vendorId: order?.vendorId || "",
          vendorRating: data.vendorRating,
          isAnonymous: data.isAnonymous,
          itemReviews: data.itemReviews,
        },
      },
      {
        onSuccess: () => {
          toast.success("Review submitted successfully! Thank you.")
          router.push("/customer/reviews")
        },
        onError: (err: AxiosError<{ error: string }> | Error) => {
          if ("response" in err && err.response?.data?.error) {
            toast.error(err.response.data.error)
          } else {
            toast.error(err.message || "Failed to submit review")
          }
        },
      }
    )
  }

  const onInvalid = (errors: FieldErrors<CustomerReviewFormValues>) => {
    const firstError = Object.keys(errors)[0]
    let elementId = `field-${firstError}`

    if (firstError === "itemReviews" && Array.isArray(errors.itemReviews)) {
      const firstInvalidItemIndex = errors.itemReviews.findIndex(
        (err: unknown) => err !== undefined
      )
      if (firstInvalidItemIndex !== -1) {
        elementId = `field-itemReviews-${firstInvalidItemIndex}`
      }
    }

    const element = document.getElementById(elementId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    } else {
      toast.error("Please fill in all required fields.")
    }
  }

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

  if (order.isRated) {
    return (
      <EmptyState
        title="Already Reviewed"
        description="You have already submitted a review for this order."
        icon={<Star className="size-8 text-muted-foreground/50" />}
        action={{
          label: "Back to Reviews",
          href: "/customer/reviews",
        }}
        className="py-20"
      />
    )
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

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        {/* Vendor Rating Section */}
        <Controller
          name="vendorRating"
          control={control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="rounded-[24px] border border-border bg-card p-6 shadow-sm sm:p-8"
              id="field-vendorRating"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Store className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold">
                    Rate the Vendor
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    How was the service, packaging, and delivery?
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`vendor-${star}`}
                      type="button"
                      onClick={() => field.onChange(star)}
                      onMouseEnter={() => setHoveredVendorRating(star)}
                      onMouseLeave={() => setHoveredVendorRating(0)}
                      className="rounded-full transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                    >
                      <Star
                        className={`size-10 transition-colors ${
                          star <= (hoveredVendorRating || field.value)
                            ? "fill-primary text-primary"
                            : "fill-muted text-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  {field.value === 0
                    ? "Tap a star to rate"
                    : `${field.value} out of 5 stars`}
                </p>
                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error]}
                    className="mt-2 text-center"
                  />
                )}
              </div>
            </Field>
          )}
        />

        {/* Item Reviews Section */}
        <div className="space-y-6">
          <h2 className="font-heading text-xl font-bold tracking-tight">
            Rate your items
          </h2>

          {fields.map((fieldItem, index) => {
            const orderItem = order.items.find(
              (i: { menuItemId: string; name?: string; quantity?: number }) =>
                i.menuItemId === fieldItem.menuItemId
            )
            return (
              <Field
                key={fieldItem.id}
                className="rounded-[24px] border border-border bg-card p-6 shadow-sm sm:p-8"
                id={`field-itemReviews-${index}`}
              >
                <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Utensils className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold">
                      {orderItem?.name || "Menu Item"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Qty: {orderItem?.quantity || 1}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Rating */}
                  <Controller
                    name={`itemReviews.${index}.rating` as const}
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={`food-${index}-${star}`}
                              type="button"
                              onClick={() => field.onChange(star)}
                              onMouseEnter={() =>
                                setHoveredItemRatings((prev) => ({
                                  ...prev,
                                  [index]: star,
                                }))
                              }
                              onMouseLeave={() =>
                                setHoveredItemRatings((prev) => ({
                                  ...prev,
                                  [index]: 0,
                                }))
                              }
                              className="rounded-full transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                            >
                              <Star
                                className={`size-8 transition-colors ${
                                  star <=
                                  (hoveredItemRatings[index] ||
                                    0 ||
                                    field.value)
                                    ? "fill-primary text-primary"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="mt-2 text-center"
                          />
                        )}
                      </div>
                    )}
                  />

                  {/* Title */}
                  <Controller
                    name={`itemReviews.${index}.title` as const}
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">
                          Review Title (Required)
                        </label>
                        <Input
                          {...field}
                          placeholder="e.g. Delicious!, A bit too spicy"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </div>
                    )}
                  />

                  {/* Comments */}
                  <Controller
                    name={`itemReviews.${index}.comments` as const}
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="space-y-2">
                        <label className="flex justify-between text-sm font-semibold">
                          <span>Details (Optional)</span>
                          <span
                            className={
                              (field.value?.length || 0) >= 500
                                ? "text-destructive"
                                : "font-normal text-muted-foreground"
                            }
                          >
                            {field.value?.length || 0}/500
                          </span>
                        </label>
                        <Textarea
                          {...field}
                          placeholder="Tell us more about this item..."
                          maxLength={500}
                          className="min-h-[100px] resize-y"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </div>
                    )}
                  />
                </div>
              </Field>
            )
          })}
        </div>

        {/* Anonymous Toggle */}
        <Controller
          name="isAnonymous"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="space-y-0.5">
                <label htmlFor="isAnonymous" className="text-sm font-semibold">
                  Submit Anonymously
                </label>
                <p className="text-xs text-muted-foreground">
                  Hide your order details from the vendor.
                </p>
              </div>
              <Switch
                id="isAnonymous"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={submitReview.isPending}
        >
          {submitReview.isPending ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </form>
    </div>
  )
}
