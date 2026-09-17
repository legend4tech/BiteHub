"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useCart } from "@/hooks/useCart"
import { orderFormInputSchema, type OrderFormInputValues } from "@/lib/schemas"
import { normaliseNigerianPhone } from "@/lib/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { formatPriceExact } from "@/lib/format"
import { computeMonnifyServiceFee } from "@/lib/fees"
import { PLATFORM_FLAT_FEE } from "@/lib/constants"
import apiClient from "@/lib/axios"
import { AxiosError } from "axios"
import { useCreateOrder } from "@/hooks/shared/usePublicMutations"
import { CustomerDetailsFields } from "@/components/cart/CustomerDetailsFields"
import { useCustomerProfile } from "@/hooks/customer/useCustomerProfile"
import { useCustomerWallet } from "@/hooks/customer/useCustomerWallet"
import type { CustomerProfile } from "@/types/customer"
import { useVendorFee } from "@/hooks/vendor/useVendorFee"
import { useVendorDeliveryZones } from "@/hooks/vendor/useVendorDeliveryZones"
import Link from "next/link"
import { CheckoutSkeleton } from "@/components/shared/skeletons/PublicSkeletons"
import { OrderSummaryCard } from "@/components/cart/OrderSummaryCard"
import { CheckoutPaymentMethods } from "@/components/cart/CheckoutPaymentMethods"

export function CheckoutForm() {
  const { cart, clearCart, syncVendorDetails, total, isHydrated } = useCart()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [requiresSignup, setRequiresSignup] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [locationMismatch, setLocationMismatch] = useState(false)

  const router = useRouter()
  const { data: customerWallet, isLoading: isWalletLoading } =
    useCustomerWallet()

  const { data: vendorFee, isLoading: feeLoading } = useVendorFee(cart.vendorId)
  const {
    zones: deliveryZones,
    vendorCampus,
    vendorSchool,
    isLoading: zonesLoading,
    isError: zonesError,
    refetch: refetchZones,
  } = useVendorDeliveryZones(cart.vendorId)
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

  const [isEditingAddress, setIsEditingAddress] = useState(false)

  const {
    data: profileData,
    isCustomer,
    isProfileLoading,
  } = useCustomerProfile()
  const customerProfile = profileData ?? null

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (profileData) {
      form.reset({
        ...form.getValues(),
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        location: profileData.preferredLandmark || "",
        exactLocation: profileData.preferredExactLocation || "",
        notes: "",
      })
    } else if (!isProfileLoading) {
      // Guest: pre-fill from localStorage
      const saved = localStorage.getItem("bitehub_customer")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          form.reset({ ...form.getValues(), ...parsed, notes: "" })
        } catch (e) {}
      }
    }
  }, [profileData, isProfileLoading, form])

  useEffect(() => {
    if (cart.vendorId && vendorFee) {
      syncVendorDetails(
        cart.vendorId,
        cart.vendorDeliveryFee, // preserve existing fee — avoids overwriting the fee set by the delivery zones effect
        vendorFee.prepTime,
        vendorFee.monnifySubaccountCode
      )
    }
  }, [cart.vendorId, cart.vendorDeliveryFee, vendorFee, syncVendorDetails])

  const selectedLocation = form.watch("location")

  useEffect(() => {
    if (deliveryZones.length > 0 && selectedLocation && cart.vendorId) {
      let fee = 0
      let isValid = false
      deliveryZones.forEach((z) => {
        if (z.name === selectedLocation) {
          fee = z.fee
          isValid = true
        }
        z.subLandmarks.forEach((s) => {
          if (`${z.name} - ${s.name}` === selectedLocation) {
            fee = s.fee
            isValid = true
          }
        })
      })

      if (isValid) {
        if (cart.vendorDeliveryFee !== fee) {
          syncVendorDetails(cart.vendorId, fee)
        }
        setLocationMismatch(false)
      } else {
        // Saved location doesn't exist on this vendor's campus — reset and prompt.
        form.setValue("location", "", { shouldValidate: true })
        syncVendorDetails(cart.vendorId, 0)
        setLocationMismatch(true)
        setIsEditingAddress(true) // auto-open dialog so customer can pick immediately
        toast.warning(
          "Your saved delivery zone isn't available for this vendor. Please select one below."
        )
      }
    }
  }, [
    deliveryZones,
    selectedLocation,
    cart.vendorId,
    cart.vendorDeliveryFee,
    syncVendorDetails,
    form,
  ])

  const paymentMethod = form.watch("paymentMethod")

  const isValidLocation = deliveryZones.some(
    (z) =>
      z.name === selectedLocation ||
      z.subLandmarks.some((s) => `${z.name} - ${s.name}` === selectedLocation)
  )
  const noZonesAvailable =
    !zonesLoading && !zonesError && deliveryZones.length === 0
  // Cross-campus: vendor is on a different campus from the customer
  const isCrossCampus =
    noZonesAvailable &&
    !!vendorCampus &&
    !!customerProfile?.campus &&
    vendorCampus.toLowerCase() !== customerProfile.campus.toLowerCase()

  const isCrossSchool =
    noZonesAvailable &&
    !!vendorSchool &&
    !!customerProfile?.school &&
    vendorSchool.toLowerCase() !== customerProfile.school.toLowerCase()

  const calculatedTotal = total + cart.vendorDeliveryFee
  const targetAmountToReceive = calculatedTotal + PLATFORM_FLAT_FEE
  const monnifyFee =
    paymentMethod === "wallet"
      ? 0
      : computeMonnifyServiceFee(targetAmountToReceive)
  const serviceFee = monnifyFee + PLATFORM_FLAT_FEE
  const finalTotal = calculatedTotal + serviceFee

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

          if (isCustomer) {
            // Fire and forget to save their latest delivery preferences
            apiClient
              .patch("/api/customer/me", {
                preferredLandmark: values.location,
                preferredExactLocation: values.exactLocation,
              })
              .catch(console.error)
          }

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
          toast.error(apiError)
        },
        onSettled: () => {
          setLoading(false)
        },
      }
    )
  }

  // Handle unmounted or unhydrated state
  if (!mounted || !isHydrated) {
    return <CheckoutSkeleton />
  }

  // Handle empty cart state
  if (cart.items.length === 0) {
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

  return (
    <>
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
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error("Form validation failed:", errors)
          toast.error(
            "Please provide all required delivery details before paying."
          )
        })}
        className="grid gap-8 align-top lg:grid-cols-12"
      >
        {/* Left Column: Details & Payment */}
        <div className="space-y-8 lg:col-span-7 xl:col-span-8">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-heading text-xl font-semibold">
              Delivery Details
            </h2>
            {isProfileLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-24 rounded-2xl bg-muted" />
              </div>
            ) : (
              <CustomerDetailsFields
                control={form.control}
                getValues={form.getValues}
                deliveryZones={deliveryZones}
                zonesLoading={zonesLoading}
                customerProfile={customerProfile}
                isEditingAddress={isEditingAddress}
                setIsEditingAddress={setIsEditingAddress}
                zonesError={zonesError}
                onRetryZones={refetchZones}
                locationMismatch={locationMismatch}
                noZonesAvailable={noZonesAvailable}
                isCrossCampus={isCrossCampus}
                isCrossSchool={isCrossSchool}
                vendorCampus={vendorCampus}
                vendorSchool={vendorSchool}
              />
            )}
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
            <CheckoutPaymentMethods
              control={form.control}
              isCustomer={isCustomer}
              isWalletLoading={isWalletLoading}
              customerWallet={customerWallet}
              targetAmountToReceive={targetAmountToReceive}
              serviceFee={serviceFee}
              router={router}
            />
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4">
          <OrderSummaryCard
            cart={cart}
            total={total}
            serviceFee={serviceFee}
            finalTotal={finalTotal}
            loading={loading}
            isSyncing={isSyncing}
            selectedLocation={selectedLocation}
            isValidLocation={isValidLocation}
            noZonesAvailable={noZonesAvailable}
            isCrossCampus={isCrossCampus}
            isCrossSchool={isCrossSchool}
            vendorCampus={vendorCampus}
            vendorSchool={vendorSchool}
            serverError={serverError}
            requiresLogin={requiresLogin}
            requiresSignup={requiresSignup}
          />
        </div>
      </form>
    </>
  )
}
