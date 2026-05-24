"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, X, Minus, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/useCart"
import { orderFormInputSchema, type OrderFormInputValues } from "@/lib/schemas"
import { normaliseNigerianPhone } from "@/lib/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { Field, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { formatPrice } from "@/lib/format"
import apiClient from "@/lib/axios"
import { AxiosError } from "axios"

interface OrderFormProps {
  open: boolean
  onClose: () => void
}

export function OrderForm({ open, onClose }: OrderFormProps) {
  const {
    cart,
    updateQuantity,
    removeItem,
    clearCart,
    syncVendorDetails,
    total,
  } = useCart()
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
    },
  })

  // Ensure we have the absolute latest delivery fee from the DB right before checkout
  // This solves the edge case where a vendor changes their fee while a student has
  // a dormant cart saved in their browser's local storage.
  useEffect(() => {
    if (open && cart.vendorId) {
      apiClient
        .get(`/vendors/fee/${cart.vendorId}`)
        .then((res) => {
          if (res.data && typeof res.data.deliveryFee === "number") {
            syncVendorDetails(
              cart.vendorId!,
              res.data.deliveryFee,
              res.data.prepTime
            )
          }
        })
        .catch((err) =>
          console.error("Failed to sync latest delivery fee", err)
        )
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
        <div className="sticky top-0 flex items-center justify-between rounded-t-3xl border-b border-border bg-card px-6 py-4">
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
          {/* Cart items */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Your items</p>
            {cart.items.map((ci) => (
              <div
                key={ci.menuItem.id}
                className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3"
              >
                <p className="flex-1 text-sm leading-snug font-medium">
                  {ci.menuItem.name}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      updateQuantity(ci.menuItem.id, ci.quantity - 1)
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">
                    {ci.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      updateQuantity(ci.menuItem.id, ci.quantity + 1)
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
                <p className="w-20 text-right text-sm font-bold">
                  {formatPrice(ci.menuItem.price * ci.quantity)}
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => removeItem(ci.menuItem.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>
                  {formatPrice(total - (cart.vendorDeliveryFee || 0))}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span>
                  {(cart.vendorDeliveryFee || 0) > 0
                    ? formatPrice(cart.vendorDeliveryFee || 0)
                    : "Free"}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            {cart.vendorPrepTime && (
              <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
                <span className="animate-pulse">⏱️</span>
                <span className="font-medium">
                  Estimated prep time: {cart.vendorPrepTime}
                </span>
              </div>
            )}
          </div>

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
            disabled={loading || cart.items.length === 0}
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
