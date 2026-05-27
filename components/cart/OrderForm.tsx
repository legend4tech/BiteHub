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
import { computePaystackServiceFee } from "@/lib/fees"
import apiClient from "@/lib/axios"
import { AxiosError } from "axios"
import { OrderFormCartItems } from "@/components/cart/OrderFormCartItems"
import dynamic from "next/dynamic"

const PaystackHandler = dynamic(
  () => import("@/components/cart/PaystackHandler"),
  { ssr: false }
)

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
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(5)

  const form = useForm<OrderFormInputValues>({
    resolver: zodResolver(
      orderFormInputSchema as never
    ) as unknown as Resolver<OrderFormInputValues>,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      notes: "",
      paymentMethod: "paystack",
    },
  })

  // Load saved email from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("bitehub_customer_email")
      if (savedEmail) {
        form.setValue("email", savedEmail)
      }
    }
  }, [form])

  useEffect(() => {
    if (open && cart.vendorId) {
      setTimeout(() => {
        setIsSyncing(true)
      }, 0)
      apiClient
        .get(`/vendors/fee/${cart.vendorId}`)
        .then((res) => {
          if (res.data && typeof res.data.deliveryFee === "number") {
            syncVendorDetails(
              cart.vendorId!,
              res.data.deliveryFee,
              res.data.prepTime,
              res.data.paystackSubaccountCode
            )
          }
        })
        .catch((err) =>
          console.error("Failed to sync latest delivery fee", err)
        )
        .finally(() => {
          setIsSyncing(false)
        })

      apiClient
        .get("/admin/settings/global")
        .then((res) => {
          if (res.data && typeof res.data.platformFeePercentage === "number") {
            setPlatformFeePercent(res.data.platformFeePercentage)
          }
        })
        .catch((err) => console.error("Failed to sync global settings", err))
    }
  }, [open, cart.vendorId, syncVendorDetails])

  // Gross-up formula: collect exactly enough from the customer so Paystack's 1.5% cut
  // of the total equals serviceFee. Vendor absorbs zero processing cost.
  // See lib/fees.ts for the full derivation.
  const serviceFee = computePaystackServiceFee(total)
  const finalTotal = total + serviceFee

  // Platform commission on the base subtotal (food + delivery) only — exact decimal.
  // Must match the backend calculation in /api/orders/route.ts
  const platformCommission = total * (platformFeePercent / 100)
  // Paystack requires kobo as an integer; Math.round() only at this final conversion step.
  const transactionChargeKobo = Math.round(platformCommission * 100)

  const [paystackConfig, setPaystackConfig] = useState<{
    reference: string
    email: string
    amount: number
    publicKey: string
    subaccount?: string
    bearer?: string
    transaction_charge?: number
    metadata?: Record<string, unknown>
  } | null>(null)

  if (!open) return null

  const onSubmit = async (values: OrderFormInputValues) => {
    setServerError(null)

    if (cart.items.length === 0 || !cart.vendorId) return

    if (!cart.vendorPaystackSubaccountCode) {
      setServerError(
        "This vendor is not connected to Paystack. Cannot process payment."
      )
      return
    }

    const customerPhone = normaliseNigerianPhone(values.phone)
    const reference = new Date().getTime().toString()

    setLoading(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("bitehub_customer_email", values.email)
      }

      // 1. Create the pending order first so the webhook can find it
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
        notes: values.notes,
        paymentMethod: "paystack",
        paystackReference: reference,
        total: finalTotal,
      })

      const { orderId } = response.data

      // 2. Configure and trigger Paystack popup
      setPaystackConfig({
        reference,
        email: values.email,
        amount: Math.round(finalTotal * 100), // kobo — must be integer; round avoids fractional kobo drift
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
        subaccount: cart.vendorPaystackSubaccountCode,
        bearer: "subaccount", // Platform takes its cut, vendor bears the fee difference since we already added serviceFee to finalTotal
        transaction_charge: transactionChargeKobo, // Dynamically overrides the subaccount's fixed percentage!
        metadata: {
          orderId,
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: values.name,
            },
            {
              display_name: "Phone Number",
              variable_name: "phone_number",
              value: values.phone,
            },
          ],
        },
      })
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
              <span>Subtotal & Delivery</span>
              <span>{formatPrice(total)}</span>
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
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    placeholder="Your email address * (for receipt)"
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

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Pay with Paystack</h4>
                  <p className="text-xs text-muted-foreground">
                    Secure, automated payments
                  </p>
                </div>
                <div className="flex h-8 items-center rounded bg-white px-2 shadow-sm">
                  <span className="font-bold text-[#0BA4DB]">paystack</span>
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
            disabled={loading || isSyncing || cart.items.length === 0}
          >
            {loading || isSyncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShoppingBag className="size-4" />
            )}
            {loading ? "Processing…" : `Pay ${formatPriceExact(finalTotal)}`}
          </Button>
        </form>

        {paystackConfig && (
          <PaystackHandler
            config={paystackConfig}
            onSuccess={async (_reference: string) => {
              const orderId = paystackConfig?.metadata?.orderId as string
              try {
                // Manually verify payment in case webhook is delayed or blocked in dev
                await apiClient.post(`/orders/${orderId}/verify`)
              } catch (e) {
                console.error("Manual verification failed", e)
              }
              toast.success("Payment successful! Order confirmed.")
              onClose()
              router.push(`/order/${orderId}`)
              clearCart()
            }}
            onClose={() => {
              toast.error("Payment cancelled. You can try again.")
              setLoading(false)
              setPaystackConfig(null) // reset config so it can be re-triggered
            }}
          />
        )}
      </div>
    </div>
  )
}
