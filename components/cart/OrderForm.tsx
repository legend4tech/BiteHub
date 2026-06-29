 
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
import { useCreateOrder } from "@/hooks/mutations/usePublicMutations"
import { OrderFormCartItems } from "@/components/cart/OrderFormCartItems"
import { CustomerDetailsFields } from "@/components/cart/CustomerDetailsFields"

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

  const createOrderMutation = useCreateOrder()

  if (!open) return null

  const onSubmit = (values: OrderFormInputValues) => {
    setServerError(null)

    if (cart.items.length === 0 || !cart.vendorId) return

    const customerPhone = normaliseNigerianPhone(values.phone)

    setLoading(true)
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

    createOrderMutation.mutate(
      {
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
      },
      {
        onSuccess: (data: { checkoutUrl: string }) => {
          const { checkoutUrl } = data

          toast.success("Redirecting to secure payment...")
          onClose()
          clearCart()
          window.location.href = checkoutUrl
        },
        onError: (error: unknown) => {
          const apiError =
            error instanceof AxiosError
              ? error.response?.data?.error
              : "Something went wrong placing your order. Please try again."
          setServerError(apiError)
        },
        onSettled: () => {
          setLoading(false)
        },
      }
    )
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

          <CustomerDetailsFields
            control={form.control}
            deliveryZones={deliveryZones}
          />

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
