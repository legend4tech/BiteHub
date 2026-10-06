"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Star, Loader2, Utensils, X } from "lucide-react"
import { toast } from "sonner"
import type { AxiosError } from "axios"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldError } from "@/components/ui/field"

import { useSubmitReview } from "@/hooks/customer/useCustomerReviews"
import {
  singleItemReviewSchema,
  type SingleItemReviewValues,
} from "@/lib/schemas/customer"
import type { CustomerReviewOrder } from "@/types/customer"

interface ItemReviewFormProps {
  order: CustomerReviewOrder
  orderItem: {
    menuItemId: string
    name?: string
    quantity?: number
    image?: string
  }
  isExpanded: boolean
  onToggleExpand: () => void
  onSuccess: () => void
}

export function ItemReviewForm({
  order,
  orderItem,
  isExpanded,
  onToggleExpand,
  onSuccess,
}: ItemReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState(0)
  const submitReview = useSubmitReview()

  const { control, handleSubmit, reset } = useForm<SingleItemReviewValues>({
    resolver: zodResolver(singleItemReviewSchema),
    defaultValues: { rating: 0, title: "", comments: "", isAnonymous: false },
  })

  // We watch the rating to optionally conditionally render fields, though now
  // since the user clicked "Review", we can just show everything, or we can keep the UX
  // where the title/comments only appear after they select a star rating.
  // The user approved the plan to "instantly shows the stars, title, and comments boxes"
  // when "Review" is clicked. So we show them all.

  const onSubmit = (data: SingleItemReviewValues) => {
    submitReview.mutate(
      {
        orderId: order.orderId,
        customerReview: {
          orderId: order.orderId,
          vendorId: order.vendorId,
          // Vendor is already rated, so we send 0 or omit it. The API allows 0.
          vendorRating: 0,
          isAnonymous: data.isAnonymous,
          itemReviews: [
            {
              menuItemId: orderItem.menuItemId,
              rating: data.rating,
              title: data.title,
              comments: data.comments,
            },
          ],
        },
      },
      {
        onSuccess: () => {
          toast.success("Item review submitted successfully!")
          reset()
          onSuccess()
        },
        onError: (err: AxiosError<{ error: string }> | Error) => {
          if ("response" in err && err.response?.data?.error) {
            toast.error(err.response.data.error)
          } else {
            toast.error(err.message || "Failed to submit item review")
          }
        },
      }
    )
  }

  return (
    <Field
      className="rounded-[24px] border border-border bg-card p-6 shadow-sm sm:p-8"
      id={`field-item-${orderItem.menuItemId}`}
    >
      <div
        className={`flex items-center justify-between border-border ${isExpanded ? "mb-6 border-b pb-4" : ""}`}
      >
        <div className="flex items-center gap-3">
          {orderItem?.image ? (
            <Image
              src={orderItem.image}
              alt={orderItem.name || "Menu Item"}
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-full object-cover shadow-sm"
              unoptimized
            />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Utensils className="size-5 text-primary" />
            </div>
          )}
          <div>
            <h3 className="font-heading text-lg font-bold">
              {orderItem?.name || "Menu Item"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Qty: {orderItem?.quantity || 1}
            </p>
          </div>
        </div>
        {!isExpanded ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleExpand}
          >
            Review
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleExpand}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Rating */}
          <Controller
            name="rating"
            control={control}
            render={({ field, fieldState }) => (
              <div className="flex flex-col items-center justify-center">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`food-star-${star}`}
                      type="button"
                      onClick={() => field.onChange(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="rounded-full transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                    >
                      <Star
                        className={`size-8 transition-colors ${
                          star <= (hoveredRating || field.value)
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
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="text-sm font-semibold">Review Title</label>
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
            name="comments"
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

          <Controller
            name="isAnonymous"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="space-y-0.5">
                  <label
                    htmlFor={`isAnon-${orderItem.menuItemId}`}
                    className="text-sm font-semibold"
                  >
                    Submit Anonymously
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Hide your details from the vendor.
                  </p>
                </div>
                <Switch
                  id={`isAnon-${orderItem.menuItemId}`}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={submitReview.isPending || submitReview.isSuccess}
          >
            {submitReview.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>
      )}
    </Field>
  )
}
