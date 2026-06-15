"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, X, Loader2 } from "lucide-react"
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
import { formatPrice, formatPriceExact } from "@/lib/format"
import { computeMonnifyServiceFee } from "@/lib/fees"
import apiClient from "@/lib/axios"
import { AxiosError } from "axios"
import { OrderFormCartItems } from "@/components/cart/OrderFormCartItems"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DeliveryZone {
  id: string
  name: string
  fee: number
  subLandmarks: { id: string; name: string; fee: number }[]
}

interface OrderFormProps {
  open: boolean
  onClose: () => void
}

export function OrderForm({ open, onClose }: OrderFormProps) {
  const { cart, clearCart, syncVendorDetails, total } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])

  const form = useForm<OrderFormInputValues>({
    resolver: zodResolver(
      orderFormInputSchema as never
    ) as unknown as Resolver<OrderFormInputValues>,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      exactLocation: "",
      notes: "",
      paymentMethod: "monnify",
    },
  })

  useEffect(() => {
    const saved = localStorage.getItem("bitehub_customer")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        form.reset({ ...form.getValues(), ...parsed, notes: "" })
      } catch (e) {}
    }
  }, [form])

  // Local storage handles email loading now

  useEffect(() => {
    if (open && cart.vendorId) {
      setTimeout(() => {
        setIsSyncing(true)
      }, 0)
      apiClient
        .get(`/vendors/fee/${cart.vendorId}`)
        .then((res) => {
          if (res.data) {
            // We set fee to 0 initially to force location selection
            syncVendorDetails(
              cart.vendorId!,
              0,
              res.data.prepTime,
              res.data.monnifySubaccountCode
            )
          }
        })
        .catch((err) =>
          console.error("Failed to sync latest vendor details", err)
        )
        .finally(() => {
          setIsSyncing(false)
        })

      apiClient
        .get(`/vendors/${cart.vendorId}/delivery-zones`)
        .then((res) => setDeliveryZones(res.data))
        .catch((err) => console.error("Failed to fetch delivery zones", err))
    }
  }, [open, cart.vendorId, syncVendorDetails])

  const selectedLocation = form.watch("location")

  // Auto-resolve fee when deliveryZones or selectedLocation changes (fixes localStorage restore bug)
  useEffect(() => {
    if (deliveryZones.length > 0 && selectedLocation && cart.vendorId) {
      let fee = 0
      deliveryZones.forEach((z) => {
        if (z.name === selectedLocation) fee = z.fee
        z.subLandmarks.forEach((s) => {
          if (`${z.name} - ${s.name}` === selectedLocation) fee = s.fee
        })
      })

      // Only update if it's different from current to prevent infinite loops
      if (cart.vendorDeliveryFee !== fee) {
        syncVendorDetails(cart.vendorId, fee)
      }
    }
  }, [
    deliveryZones,
    selectedLocation,
    cart.vendorId,
    cart.vendorDeliveryFee,
    syncVendorDetails,
  ])

  // Close the form automatically if the last item is removed
  useEffect(() => {
    if (open && cart.items.length === 0) {
      onClose()
    }
  }, [cart.items.length, open, onClose])

  // Gross-up formula: collect exactly enough from the customer so Monnify's 1.5% cut
  // of the total equals serviceFee. Vendor absorbs zero processing cost.
  // See lib/fees.ts for the full derivation.
  const serviceFee = computeMonnifyServiceFee(total)
  const finalTotal = total + serviceFee

  if (!open) return null

  const onSubmit = async (values: OrderFormInputValues) => {
    setServerError(null)

    if (cart.items.length === 0 || !cart.vendorId) return

    const customerPhone = normaliseNigerianPhone(values.phone)

    setLoading(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "bitehub_customer",
          JSON.stringify({
            name: values.name,
            email: values.email,
            phone: values.phone,
            location: values.location,
            exactLocation: values.exactLocation,
          })
        )
      }

      // 1. POST to our backend — it creates the order AND inits Monnify server-side.
      //    Returns { orderId, checkoutUrl } where checkoutUrl is from Monnify's API.
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
        customerEmail: values.email,
        customerPhone,
        location: values.location,
        exactLocation: values.exactLocation,
        notes: values.notes,
        paymentMethod: "monnify",
        total: finalTotal,
      })

      const { orderId, checkoutUrl } = response.data

      // 2. Redirect the current tab to Monnify's hosted checkout.
      //    The backend set redirectUrl = /order/${orderId}, so after payment
      //    Monnify redirects the customer back to their order page automatically.
      toast.success("Redirecting to secure payment...")
      onClose()
      clearCart()
      window.location.href = checkoutUrl
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

          {/* Fees Breakdown */}
          <div className="space-y-2 rounded-2xl bg-muted/30 p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Items Subtotal</span>
              <span>
                {formatPrice(
                  cart.items.reduce(
                    (sum, ci) => sum + ci.menuItem.price * ci.quantity,
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee</span>
              <span>
                {cart.vendorDeliveryFee > 0
                  ? formatPriceExact(cart.vendorDeliveryFee)
                  : "Select location"}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Service Fee</span>
              <span>{formatPriceExact(serviceFee)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span>Total to Pay</span>
              <span>{formatPriceExact(finalTotal)}</span>
            </div>
          </div>

          {/* Customer info */}
          <div className="space-y-4">
            <p className="text-sm font-semibold">Your details</p>

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="e.g. John Doe"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    placeholder="For your receipt"
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
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    Phone Number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    placeholder="e.g. 08012345678"
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
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    Nearest Landmark (Delivery Zone){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={deliveryZones.length === 0}
                  >
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue
                        placeholder={
                          deliveryZones.length === 0
                            ? "No delivery zones available"
                            : "Select delivery zone"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {deliveryZones.map((zone) => (
                        <SelectGroup key={zone.id}>
                          <SelectItem
                            value={zone.name}
                            className="font-bold text-foreground"
                          >
                            <span className="ml-1">{zone.name}</span>
                          </SelectItem>
                          {zone.subLandmarks.map((sub) => (
                            <SelectItem
                              key={sub.id}
                              value={`${zone.name} - ${sub.name}`}
                            >
                              <span className="ml-4 text-muted-foreground">
                                {sub.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="exactLocation"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label className="text-sm font-medium" htmlFor={field.name}>
                    Exact Location (Lodge Name){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="e.g. Block C, Room 4, SUG Lodge"
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

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Pay with Monnify</h4>
                  <p className="text-xs text-muted-foreground">
                    Secure, automated payments
                  </p>
                </div>
                <div className="flex h-8 items-center rounded bg-white px-2 shadow-sm">
                  <span className="font-bold text-primary">monnify</span>
                </div>
              </div>
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
              isSyncing ||
              cart.items.length === 0 ||
              !selectedLocation
            }
          >
            {loading || isSyncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShoppingBag className="size-4" />
            )}
            {loading ? "Processing…" : `Pay ${formatPriceExact(finalTotal)}`}
          </Button>
        </form>
      </div>
    </div>
  )
}
