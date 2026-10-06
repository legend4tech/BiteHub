"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { OrderStatusTracker } from "@/components/cart/OrderStatusTracker"
import { OrderItemsBreakdown } from "@/components/cart/OrderItemsBreakdown"
import { OrderHeroCard } from "@/components/cart/OrderHeroCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import {
  Home,
  ShoppingBag,
  ChevronRight,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOrder } from "@/hooks/shared/useOrder"
import {
  usePayOrder,
  useVerifyOrderPayment,
} from "@/hooks/shared/usePublicMutations"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Star } from "lucide-react"
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants"

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { data: session } = useSession()
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)

  const { data: order, isLoading, isError, error, refetch } = useOrder(orderId)
  const [isRetryingPayment, setIsRetryingPayment] = useState(false)
  const [isVerifyingDirectly, setIsVerifyingDirectly] = useState(true)
  const [isStalePayment, setIsStalePayment] = useState(false)
  const hasVerified = useRef(false)

  const verifyPaymentMutation = useVerifyOrderPayment()

  // Immediately verify the source of truth with Monnify on page load
  useEffect(() => {
    if (
      order?.paymentStatus === PAYMENT_STATUS.PENDING &&
      !hasVerified.current
    ) {
      hasVerified.current = true
      // Verification is already in progress (isVerifyingDirectly initialized to true)
      verifyPaymentMutation.mutate(orderId, {
        onSuccess: (data: { success: boolean }) => {
          if (data.success) {
            // It was actually paid! Update the UI immediately.
            refetch()
          } else {
            // It's genuinely pending/cancelled/failed at Monnify.
            // Since they are on this tracking page, it means they dropped off.
            setIsStalePayment(true)
          }
        },
        onError: (err: unknown) => {
          console.error("Failed to verify transaction status directly:", err)
          // Fallback if API fails: show the retry button anyway so they aren't stuck
          setIsStalePayment(true)
        },
        onSettled: () => {
          setIsVerifyingDirectly(false)
        },
      })
    }
  }, [order?.paymentStatus, orderId, refetch, verifyPaymentMutation])

  const payOrderMutation = usePayOrder()

  const handlePaymentRetry = () => {
    if (!order) return
    setIsRetryingPayment(true)
    payOrderMutation.mutate(order.orderId, {
      onSuccess: (data: { checkoutUrl?: string }) => {
        if (data.checkoutUrl) {
          toast.success("Redirecting to secure payment...")
          window.location.href = data.checkoutUrl
        } else {
          toast.error("Missing checkout URL")
        }
      },
      onError: (err: unknown) => {
        console.error(err)
        const errMsg =
          err instanceof Error
            ? err.message
            : "Failed to initiate payment retry. Please contact support."
        toast.error(errMsg)
      },
      onSettled: () => {
        setIsRetryingPayment(false)
      },
    })
  }

  // Removed automatic FeedbackModal trigger

  const handleRefresh = async () => {
    await refetch()
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-6 py-12">
          <PageSkeleton variant="order-detail" />
        </div>
        <Footer />
      </main>
    )
  }

  if (isError || !order) {
    const isNotFound =
      (error as { response?: { status?: number } })?.response?.status === 404

    if (isNotFound) {
      return (
        <main className="min-h-screen bg-background text-foreground">
          <Navbar />
          <div className="relative mx-auto max-w-2xl px-4 pt-6">
            <div className="flex items-center justify-between pb-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/order">
                  <ShoppingBag className="mr-2 size-4" />
                  Back to order track
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <Home className="mr-2 size-4" />
                  Back to home
                </Link>
              </Button>
            </div>
          </div>
          <EmptyState
            title="Order not found"
            description={`We couldn't find an order with ID "${orderId}". Please check the ID or try again later.`}
            action={{
              label: "Back to order",
              href: "/order",
              icon: <ShoppingBag className="size-4" />,
            }}
            className="py-40"
          />
          <Footer />
        </main>
      )
    }

    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <FetchError
          title="Failed to load order"
          message="We encountered an issue while retrieving your order details."
          onRetry={handleRefresh}
          onBack="/"
          className="py-20"
        />
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <Navbar />

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[300px] w-[400px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-4 px-4 py-10 sm:px-6 sm:py-14">
        {/* ── Back links ─────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/order">
              <ShoppingBag className="mr-2 size-4" />
              Back to order track
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="mr-2 size-4" />
              Back to home
            </Link>
          </Button>
        </div>

        <OrderHeroCard order={order} />

        {/* ── Payment verification banner ─────────────────────────── */}
        {order.paymentStatus === PAYMENT_STATUS.PENDING &&
          (!isStalePayment || isVerifyingDirectly) && (
            <div className="flex items-center gap-3 rounded-[20px] border border-warning/20 bg-warning/10 px-5 py-4">
              <Loader2 className="size-4 shrink-0 animate-spin text-warning" />
              <div>
                <p className="text-sm font-semibold text-warning-foreground dark:text-warning">
                  Verifying your payment…
                </p>
                <p className="text-xs text-warning/80 dark:text-warning/80">
                  Contacting Monnify securely to confirm your transaction
                  status.
                </p>
              </div>
            </div>
          )}

        {/* ── Payment recovery banner ─────────────────────────────── */}
        {order.paymentStatus === PAYMENT_STATUS.PENDING &&
          order.status !== ORDER_STATUS.CANCELLED &&
          isStalePayment &&
          !isVerifyingDirectly && (
            <div className="flex flex-col items-start justify-between gap-4 rounded-[20px] border border-destructive/20 bg-destructive/5 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3 sm:items-center">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive sm:mt-0" />
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    Payment Incomplete
                  </p>
                  <p className="mt-0.5 text-xs text-destructive/80">
                    It looks like your payment wasn&apos;t completed. Please try
                    again to confirm your order.
                  </p>
                </div>
              </div>
              <Button
                onClick={handlePaymentRetry}
                disabled={isRetryingPayment}
                className="w-full shrink-0 bg-destructive text-white hover:bg-destructive/90 sm:w-auto"
              >
                {isRetryingPayment ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  "Complete Payment"
                )}
              </Button>
            </div>
          )}

        {/* ── Order status tracker ───────────────────────────────── */}
        <div className="rounded-[28px] border border-border bg-card p-7 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
                <ChevronRight className="size-4 text-primary" />
              </div>
              <h2 className="font-heading text-base font-bold sm:text-lg">
                Order status
              </h2>
            </div>
          </div>

          {order.vendorPrepTime && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
              <Clock className="size-4 animate-pulse" />
              <span className="font-medium">
                Estimated prep time: {order.vendorPrepTime}
              </span>
            </div>
          )}

          <OrderStatusTracker
            status={order.status}
            paymentStatus={order.paymentStatus}
          />
        </div>

        <OrderItemsBreakdown order={order} />

        {/* ── Review Action Button ───────────────────────────────── */}
        {order?.status === ORDER_STATUS.COMPLETED && !order.isFullyRated && (
          <div className="mt-8 rounded-[28px] border border-border bg-card p-7 text-center shadow-sm sm:p-8">
            <h3 className="mb-2 font-heading text-lg font-bold">
              How was your food?
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Help {order.vendorName} and other students by sharing your
              experience.
            </p>
            {session?.user?.role === "customer" ? (
              <Button asChild className="w-full sm:w-auto" size="lg">
                <Link href={`/customer/reviews/new/${orderId}`}>
                  <Star className="mr-2 size-4 fill-primary-foreground text-primary-foreground" />
                  Leave a Review
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => setShowGuestPrompt(true)}
                className="w-full sm:w-auto"
                size="lg"
              >
                <Star className="mr-2 size-4 fill-primary-foreground text-primary-foreground" />
                Leave a Review
              </Button>
            )}
          </div>
        )}

        {/* ── Guest Review Prompt Dialog ───────────────────────────── */}
        <Dialog open={showGuestPrompt} onOpenChange={setShowGuestPrompt}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Join BiteHub to Review</DialogTitle>
              <DialogDescription>
                Create an account or log in to leave a review and earn rewards.
                It only takes a minute!
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" asChild>
                <Link
                  href={`/customer/signup?redirect=/customer/reviews/new/${orderId}`}
                >
                  Create Account
                </Link>
              </Button>
              <Button asChild>
                <Link
                  href={`/customer/login?redirect=/customer/reviews/new/${orderId}`}
                >
                  Log In
                </Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
