"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, X, Loader2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/useCart"
import { orderFormInputSchema, type OrderFormInputValues } from "@/lib/schemas"
import { normaliseNigerianPhone } from "@/lib/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form"
import { Field, FieldError } from "@/components/ui/field"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { toast } from "sonner"
import { formatPrice } from "@/lib/format"
import apiClient from "@/lib/axios"
import { AxiosError } from "axios"
import { OrderFormCartItems } from "@/components/cart/OrderFormCartItems"

interface OrderFormProps {
  open: boolean
  onClose: () => void
}

export function OrderForm({ open, onClose }: OrderFormProps) {
  const { cart, clearCart, syncVendorDetails, total } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<OrderFormInputValues>({
    resolver: zodResolver(
      orderFormInputSchema as never
    ) as unknown as Resolver<OrderFormInputValues>,
    defaultValues: {
      name: "",
      phone: "",
      location: "",
      notes: "",
      paymentMethod: "transfer", // default
    },
  })

  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  })
  const hasPaid = useWatch({ control: form.control, name: "hasPaid" })
  const [isSyncing, setIsSyncing] = useState(true)

  // Ensure we have the absolute latest delivery fee from the DB right before checkout
  // This solves the edge case where a vendor changes their fee while a student has
  // a dormant cart saved in their browser's local storage.
  useEffect(() => {
    if (open && cart.vendorId) {
      setTimeout(() => setIsSyncing(true), 0)
      apiClient
        .get(`/vendors/fee/${cart.vendorId}`)
        .then((res) => {
          if (res.data && typeof res.data.deliveryFee === "number") {
            syncVendorDetails(
              cart.vendorId!,
              res.data.deliveryFee,
              res.data.prepTime,
              res.data.acceptsCashOnDelivery,
              res.data.paymentDetails
            )
          }
        })
        .catch((err) =>
          console.error("Failed to sync latest delivery fee", err)
        )
        .finally(() => setIsSyncing(false))
    } else if (open) {
      setTimeout(() => setIsSyncing(false), 0)
    }
  }, [open, cart.vendorId, syncVendorDetails])

  if (!open) return null

  const onSubmit = async (values: OrderFormInputValues) => {
    setServerError(null)

    if (cart.items.length === 0 || !cart.vendorId) return

    const customerPhone = normaliseNigerianPhone(values.phone)

    setLoading(true)
    try {
      const response = await apiClient.post("/orders", {
        vendorId: cart.vendorId,
        vendorName: cart.vendorName,
        vendorWhatsappNumber: cart.vendorWhatsappNumber || "",
        items: cart.items.map((ci) => ({
          menuItemId: ci.menuItem.id,
          name: ci.menuItem.name,
          price: ci.menuItem.price,
          quantity: ci.quantity,
        })),
        customerName: values.name,
        customerPhone,
        location: values.location,
        notes: values.notes,
        paymentMethod: values.paymentMethod || "transfer",
        total,
      })

      const { orderId } = response.data
      toast.success("Order placed successfully!")

      // 1. Close modal first — user stops seeing the form immediately
      onClose()
      // 2. Navigate — React will unmount the form before the cart clears
      router.push(`/order/${orderId}`)
      // 3. Clear cart last — doesn't matter, form is already gone
      clearCart()
    } catch (error) {
      const apiError =
        error instanceof AxiosError
          ? error.response?.data?.error
          : "Something went wrong placing your order. Please try again."
      setServerError(apiError)
      setLoading(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:max-w-lg sm:rounded-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-border bg-card px-6 py-4">
          <div>
            <p className="text-xs text-muted-foreground">{cart.vendorName}</p>
            <h2 className="font-heading text-lg font-bold">Place your order</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
          >
            <X />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          <OrderFormCartItems loading={loading} />

          {/* Customer info */}
          <div className="space-y-4">
            <p className="text-sm font-semibold">Your details</p>

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Your name *"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    placeholder="Phone number * (e.g. 08012345678)"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="location"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Delivery location * (e.g. Bella Hostel)"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Textarea
                    {...field}
                    id={field.name}
                    placeholder="Notes for vendor (optional)"
                    rows={2}
                    className="resize-none"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">Payment Method</label>
              <Controller
                name="paymentMethod"
                control={form.control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label
                      className={`relative flex cursor-pointer flex-col items-start gap-1 rounded-2xl border p-4 transition-colors ${
                        field.value === "transfer"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-semibold">
                          Bank Transfer
                        </span>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            field.value === "transfer"
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {field.value === "transfer" && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pay via direct transfer and send receipt to verify.
                      </p>
                      <input
                        type="radio"
                        className="sr-only"
                        {...field}
                        value="transfer"
                        checked={field.value === "transfer"}
                      />
                    </label>

                    {cart.vendorAcceptsCashOnDelivery && (
                      <label
                        className={`relative flex cursor-pointer flex-col items-start gap-1 rounded-2xl border p-4 transition-colors ${
                          field.value === "cash"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-semibold">
                            Cash on Delivery
                          </span>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              field.value === "cash"
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {field.value === "cash" && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Pay with cash when your food arrives.
                        </p>
                        <input
                          type="radio"
                          className="sr-only"
                          {...field}
                          value="cash"
                          checked={field.value === "cash"}
                        />
                      </label>
                    )}
                  </div>
                )}
              />

              {paymentMethod === "transfer" && isSyncing && (
                <PageSkeleton variant="payment-details" />
              )}

              {paymentMethod === "transfer" && !isSyncing &&
                cart.vendorPaymentDetails?.bankName && (
                  <div className="mt-4 space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                    <div>
                      <h4 className="text-sm font-semibold">
                        Please transfer {formatPrice(total)} to:
                      </h4>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between border-b border-primary/10 pb-2">
                          <span className="text-muted-foreground">
                            Bank Name
                          </span>
                          <span className="font-semibold">
                            {cart.vendorPaymentDetails.bankName}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-primary/10 py-2">
                          <span className="text-muted-foreground">
                            Account Number
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {cart.vendorPaymentDetails.accountNumber}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-6 hover:bg-primary/10"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  cart.vendorPaymentDetails!.accountNumber
                                )
                                toast.success("Account number copied!")
                              }}
                            >
                              <Copy className="size-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-muted-foreground">
                            Account Name
                          </span>
                          <span className="font-semibold">
                            {cart.vendorPaymentDetails.accountName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Controller
                      name="hasPaid"
                      control={form.control}
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              {...field}
                              checked={field.value}
                              value="true"
                            />
                            {field.value && (
                              <div className="h-3 w-3 rounded-sm bg-primary" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              I have transferred the money
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Don&apos;t check this if you haven&apos;t paid
                              yet. You will need to send the receipt to the
                              vendor on WhatsApp after placing the order.
                            </span>
                          </div>
                        </label>
                      )}
                    />
                  </div>
                )}

              {paymentMethod === "transfer" && !isSyncing &&
                !cart.vendorPaymentDetails?.bankName && (
                  <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                    This vendor has not provided their bank details. Please
                    select Cash on Delivery if available, or remove this
                    vendor&apos;s items.
                  </div>
                )}
            </div>
          </div>

          {/* Server error */}
          {serverError && (
            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="w-full"
            disabled={
              loading ||
              cart.items.length === 0 ||
              (paymentMethod === "transfer" && !hasPaid)
            }
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShoppingBag className="size-4" />
            )}
            {loading ? "Placing order…" : `Place order · ${formatPrice(total)}`}
          </Button>
        </form>
      </div>
    </div>
  )
}
