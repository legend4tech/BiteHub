"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/useCart"
import { orderFormInputSchema, type OrderFormInputValues } from "@/lib/schemas"
import { normaliseNigerianPhone } from "@/lib/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { formatPrice, formatPriceExact } from "@/lib/format"
import { computeMonnifyServiceFee } from "@/lib/fees"
import apiClient from "@/lib/axios"
import { AxiosError } from "axios"
import { useCreateOrder } from "@/hooks/shared/usePublicMutations"
import { CustomerDetailsFields } from "@/components/cart/CustomerDetailsFields"
import {
  useCustomerProfile,
  type CustomerProfile,
} from "@/hooks/customer/useCustomerProfile"
import { useVendorFee } from "@/hooks/vendor/useVendorFee"
import { useVendorDeliveryZones } from "@/hooks/vendor/useVendorDeliveryZones"
import Link from "next/link"
import type { DeliveryZone } from "@/types/vendor"

export default function CheckoutPage() {
  const { cart, clearCart, syncVendorDetails, total } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [requiresSignup, setRequiresSignup] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { data: vendorFee, isLoading: feeLoading } = useVendorFee(cart.vendorId)
  const { data: deliveryZones = [], isLoading: zonesLoading } =
    useVendorDeliveryZones(cart.vendorId)
  const isSyncing = feeLoading || zonesLoading

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

  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null)
  const [isEditingAddress, setIsEditingAddress] = useState(false)

  const { data: profileData, isCustomer } = useCustomerProfile()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (profileData) {
      setCustomerProfile(profileData)
      form.reset({
        ...form.getValues(),
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        location: profileData.preferredLocation || "",
        exactLocation: profileData.preferredExactLocation || "",
        notes: "",
      })
    } else {
      const saved = localStorage.getItem("bitehub_customer")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          form.reset({ ...form.getValues(), ...parsed, notes: "" })
        } catch (e) {}
      }
    }
  }, [profileData, form])

  useEffect(() => {
    if (cart.vendorId && vendorFee) {
      syncVendorDetails(
        cart.vendorId,
        0, // initially 0, will be updated by the delivery zone effect if a location is selected
        vendorFee.prepTime,
        vendorFee.monnifySubaccountCode
      )
    }
  }, [cart.vendorId, vendorFee, syncVendorDetails])

  const selectedLocation = form.watch("location")

  useEffect(() => {
    if (deliveryZones.length > 0 && selectedLocation && cart.vendorId) {
      let fee = 0
      deliveryZones.forEach((z) => {
        if (z.name === selectedLocation) fee = z.fee
        z.subLandmarks.forEach((s) => {
          if (`${z.name} - ${s.name}` === selectedLocation) fee = s.fee
        })
      })

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

  const paymentMethod = form.watch("paymentMethod")
  const serviceFee =
    paymentMethod === "wallet" ? 0 : computeMonnifyServiceFee(total)
  const finalTotal = total + serviceFee + cart.vendorDeliveryFee

  const createOrderMutation = useCreateOrder()

  const onSubmit = (values: OrderFormInputValues) => {
    setServerError(null)
    setRequiresLogin(false)
    setRequiresSignup(false)

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
        paymentMethod: values.paymentMethod,
        total: finalTotal,
      },
      {
        onSuccess: (data: { checkoutUrl: string }) => {
          const { checkoutUrl } = data

          toast.success("Redirecting to secure payment...")
          clearCart()
          window.location.href = checkoutUrl
        },
        onError: (error: unknown) => {
          if (
            error instanceof AxiosError &&
            error.response?.data?.requiresLogin
          ) {
            setServerError(error.response.data.error)
            setRequiresLogin(true)
            setRequiresSignup(!!error.response.data.requiresSignup)
            return
          }
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

  // Handle empty cart state
  if (mounted && cart.items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 font-heading text-3xl font-bold">
          Your cart is empty
        </h1>
        <p className="mb-8 text-muted-foreground">
          Add some delicious meals before checking out.
        </p>
        <Button asChild variant="hero" size="xl">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  if (!mounted) return null

  return (
    <main className="container mx-auto min-h-screen max-w-6xl p-4 py-8 md:p-8">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">
            Checkout
          </h1>
          <p className="text-muted-foreground">
            Complete your order from {cart.vendorName}
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-8 align-top lg:grid-cols-12"
      >
        {/* Left Column: Details & Payment */}
        <div className="space-y-8 lg:col-span-7 xl:col-span-8">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-heading text-xl font-semibold">
              Delivery Details
            </h2>
            <CustomerDetailsFields
              control={form.control}
              deliveryZones={deliveryZones}
              customerProfile={customerProfile}
              isEditingAddress={isEditingAddress}
              setIsEditingAddress={setIsEditingAddress}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-heading text-xl font-semibold">
              Order Notes
            </h2>
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Any special instructions for the vendor?"
                  className="resize-none"
                  rows={3}
                />
              )}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-heading text-xl font-semibold">
              Payment Method
            </h2>
            <Controller
              name="paymentMethod"
              control={form.control}
              render={({ field }) => (
                <div
                  className={`grid gap-4 ${isCustomer ? "md:grid-cols-2" : "grid-cols-1"}`}
                >
                  <button
                    type="button"
                    onClick={() => field.onChange("monnify")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-6 transition-all ${
                      field.value === "monnify"
                        ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className="font-bold">Card / Transfer</span>
                    <span className="mt-1 text-center text-sm text-muted-foreground">
                      Via Monnify{" "}
                      {field.value === "monnify"
                        ? `(+${formatPriceExact(serviceFee)} fee)`
                        : ""}
                    </span>
                  </button>
                  {isCustomer && (
                    <button
                      type="button"
                      onClick={() => field.onChange("wallet")}
                      className={`flex flex-col items-center justify-center rounded-xl border p-6 transition-all ${
                        field.value === "wallet"
                          ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className="font-bold">BiteHub Wallet</span>
                      <span className="mt-1 text-center text-sm text-muted-foreground">
                        Zero Fees
                      </span>
                    </button>
                  )}
                </div>
              )}
            />
          </div>

          {serverError && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-4 text-destructive">
              <p className="text-center font-medium">{serverError}</p>
              {requiresLogin && (
                <div className="mt-2 flex gap-3">
                  {requiresSignup ? (
                    <Button
                      type="button"
                      variant="hero"
                      onClick={() => router.push("/customer/signup")}
                    >
                      Create Free Account
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => router.push("/customer/login")}
                    >
                      Log in to continue
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-6 font-heading text-xl font-semibold">
              Order Summary
            </h2>

            <div className="mb-6 space-y-4">
              {cart.items.map((ci) => (
                <div
                  key={ci.menuItem.id}
                  className="flex justify-between gap-4 text-sm"
                >
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">
                      {ci.quantity}x
                    </span>
                    <span className="font-medium">{ci.menuItem.name}</span>
                  </div>
                  <span className="font-bold">
                    {formatPrice(ci.menuItem.price * ci.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-6 space-y-3 border-t border-border pt-6 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span>{formatPriceExact(total)}</span>
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
            </div>

            <div className="mb-6 flex justify-between border-t border-border pt-6 font-heading text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">
                {formatPriceExact(finalTotal)}
              </span>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full text-lg"
              disabled={
                loading ||
                isSyncing ||
                cart.items.length === 0 ||
                !selectedLocation
              }
            >
              {loading || isSyncing ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                `Pay ${formatPriceExact(finalTotal)}`
              )}
            </Button>
          </div>
        </div>
      </form>
    </main>
  )
}
