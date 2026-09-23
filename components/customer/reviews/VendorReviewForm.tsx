"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Store, Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { AxiosError } from "axios"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Field, FieldError } from "@/components/ui/field"

import { useSubmitReview } from "@/hooks/customer/useCustomerReviews"
import {
  singleVendorReviewSchema,
  type SingleVendorReviewValues,
} from "@/lib/schemas/customer"
import type { CustomerReviewOrder } from "@/types/customer"

interface VendorReviewFormProps {
  order: CustomerReviewOrder
  onSuccess: () => void
}

export function VendorReviewForm({ order, onSuccess }: VendorReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState(0)
  const submitReview = useSubmitReview()

  const { control, handleSubmit } = useForm<SingleVendorReviewValues>({
    resolver: zodResolver(singleVendorReviewSchema),
    defaultValues: { vendorRating: 0, isAnonymous: false },
  })

  const onSubmit = (data: SingleVendorReviewValues) => {
    submitReview.mutate(
      {
        orderId: order.orderId,
        customerReview: {
          orderId: order.orderId,
          vendorId: order.vendorId,
          vendorRating: data.vendorRating,
          isAnonymous: data.isAnonymous,
          itemReviews: [],
        },
      },
      {
        onSuccess: () => {
          toast.success("Vendor rating submitted successfully!")
          onSuccess()
        },
        onError: (err: AxiosError<{ error: string }> | Error) => {
          if ("response" in err && err.response?.data?.error) {
            toast.error(err.response.data.error)
          } else {
            toast.error(err.message || "Failed to submit vendor rating")
          }
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  Rate {order.vendorName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  How was the service, packaging, and overall experience?
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
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="rounded-full transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                  >
                    <Star
                      className={`size-10 transition-colors ${
                        star <= (hoveredRating || field.value)
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

      <Controller
        name="isAnonymous"
        control={control}
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="space-y-0.5">
              <label
                htmlFor="vendorIsAnonymous"
                className="text-sm font-semibold"
              >
                Submit Anonymously
              </label>
              <p className="text-xs text-muted-foreground">
                Hide your details from the vendor.
              </p>
            </div>
            <Switch
              id="vendorIsAnonymous"
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
        disabled={submitReview.isPending || submitReview.isSuccess}
      >
        {submitReview.isPending ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Vendor Rating"
        )}
      </Button>
    </form>
  )
}
