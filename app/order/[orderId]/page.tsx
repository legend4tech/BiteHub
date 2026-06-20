"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { OrderStatusTracker } from "@/components/cart/OrderStatusTracker"
import { WhatsAppButton } from "@/components/cart/WhatsAppButton"
import { StatusBadge } from "@/components/vendor-dashboard/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import {
  Home,
  ShoppingBag,
  MessageCircle,
  ChevronRight,
  Receipt,
  Copy,
  Clock,
  StickyNote,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice, formatPriceExact, formatTime } from "@/lib/format"
import { useOrder } from "@/hooks/queries/useOrder"
import apiClient from "@/lib/axios"
import { toast } from "sonner"
import {
  FeedbackModal,
  FEEDBACK_SNOOZE_DURATION,
} from "@/components/shared/FeedbackModal"

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const { data: order, isLoading, isError, error, refetch } = useOrder(orderId)
  const [isRetryingPayment, setIsRetryingPayment] = useState(false)
  const [isVerifyingDirectly, setIsVerifyingDirectly] = useState(true)
  const [isStalePayment, setIsStalePayment] = useState(false)
  const hasVerified = useRef(false)

  // Immediately verify the source of truth with Monnify on page load
  useEffect(() => {
    if (order?.paymentStatus === "pending" && !hasVerified.current) {
      hasVerified.current = true
      // Verification is already in progress (isVerifyingDirectly initialized to true)
      apiClient
        .post(`/orders/${orderId}/verify`)
        .then((res) => {
          if (res.data.success) {
            // It was actually paid! Update the UI immediately.
            refetch()
          } else {
            // It's genuinely pending/cancelled/failed at Monnify.
            // Since they are on this tracking page, it means they dropped off.
            setIsStalePayment(true)
          }
        })
        .catch((err) => {
          console.error("Failed to verify transaction status directly:", err)
          // Fallback if API fails: show the retry button anyway so they aren't stuck
          setIsStalePayment(true)
        })
        .finally(() => {
          setIsVerifyingDirectly(false)
        })
    }
  }, [order?.paymentStatus, orderId, refetch])

  const handlePaymentRetry = async () => {
    if (!order) return
    setIsRetryingPayment(true)
    try {
      const response = await apiClient.post(`/orders/${order.orderId}/pay`)
      if (response.data.checkoutUrl) {
        toast.success("Redirecting to secure payment...")
        window.location.href = response.data.checkoutUrl
      } else {
        throw new Error("Missing checkout URL")
      }
    } catch (err: unknown) {
      console.error(err)
      const errMsg =
        err instanceof Error
          ? err.message
          : "Failed to initiate payment retry. Please contact support."
      toast.error(errMsg)
      setIsRetryingPayment(false)
    }
  }

  useEffect(() => {
    if (order?.status === "completed") {
      const handled = localStorage.getItem(`feedback_handled_${orderId}`)
      const snoozedAt = localStorage.getItem(`feedback_snoozed_${orderId}`)

      const now = new Date().getTime()
      const isSnoozed =
        snoozedAt && now - parseInt(snoozedAt) < FEEDBACK_SNOOZE_DURATION

      if (!handled && !isSnoozed) {
        setTimeout(() => setShowFeedbackModal(true), 0)
      }
    }
  }, [order?.status, orderId])

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

        {/* ── Hero card: Order confirmed ─────────────────────────── */}
        <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
          {/* Coloured top strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

          <div className="p-7 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* Label */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-widest text-primary uppercase">
                    <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                    Order placed
                  </span>
                </div>

                {/* Order ID */}
                <div className="mt-3 flex items-center gap-2">
                  <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {order.orderId}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => {
                      navigator.clipboard.writeText(order.orderId)
                      toast.success("Order ID copied!")
                    }}
                  >
                    <Copy className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
                    <span className="sr-only">Copy Order ID</span>
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Copy this ID to track your order later on the &ldquo;Track
                  Order&rdquo; page.
                </p>

                {/* Meta */}
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    from{" "}
                    <span className="font-semibold text-foreground">
                      {order.vendorName}
                    </span>
                  </span>
                  <span className="text-border">·</span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at {formatTime(order.createdAt)}
                  </span>
                  <span className="text-border">·</span>
                  <span>
                    For:{" "}
                    <span className="font-semibold text-foreground">
                      {order.customerName}
                    </span>
                  </span>
                  <span className="text-border">·</span>
                  <span>
                    Deliver to:{" "}
                    <span className="font-semibold text-foreground">
                      {order.location}
                    </span>
                  </span>
                </p>
              </div>

              {/* Icon bubble */}
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <ShoppingBag className="size-6 text-primary" />
              </div>
            </div>

            {/* Status badge */}
            <div className="mt-5 border-t border-border/60 pt-5">
              <StatusBadge
                status={order.status}
                paymentStatus={order.paymentStatus}
              />
            </div>
          </div>
        </div>

        {/* ── Payment verification banner ─────────────────────────── */}
        {order.paymentStatus === "pending" &&
          (!isStalePayment || isVerifyingDirectly) && (
            <div className="flex items-center gap-3 rounded-[20px] border border-amber-500/20 bg-amber-500/10 px-5 py-4">
              <Loader2 className="size-4 shrink-0 animate-spin text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Verifying your payment…
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                  Contacting Monnify securely to confirm your transaction
                  status.
                </p>
              </div>
            </div>
          )}

        {/* ── Payment recovery banner ─────────────────────────────── */}
        {order.paymentStatus === "pending" &&
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

        {/* ── Items breakdown ────────────────────────────────────── */}
        <div className="rounded-[28px] border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border/60 px-7 py-5 sm:px-8">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
              <Receipt className="size-4 text-primary" />
            </div>
            <h2 className="font-heading text-base font-bold sm:text-lg">
              Your items
            </h2>
          </div>

          <div className="px-7 py-5 sm:px-8">
            <div className="space-y-3.5">
              {order.items.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {/* quantity pill */}
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground">
                      {item.quantity}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
              {/* Items subtotal — sum from actual items, not derived from totalAmount */}
              <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
                <span>Items subtotal</span>
                <span className="tabular-nums">
                  {formatPriceExact(
                    order.items.reduce(
                      (sum, i) => sum + i.price * i.quantity,
                      0
                    )
                  )}
                </span>
              </div>

              {/* Delivery fee */}
              <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span className="tabular-nums">
                  {(order.deliveryFee || 0) > 0
                    ? formatPriceExact(order.deliveryFee)
                    : "Free"}
                </span>
              </div>

              {/* Service / processing fee — shown separately so nothing is hidden */}
              {(order.serviceFee || 0) > 0 && (
                <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Processing Fee
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                      Monnify
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatPriceExact(order.serviceFee)}
                  </span>
                </div>
              )}

              {/* Grand total */}
              <div className="mt-2 flex items-center justify-between rounded-2xl bg-primary/8 px-4 py-3.5">
                <span className="text-sm font-bold">Total Charged</span>
                <span className="text-lg font-extrabold text-primary tabular-nums">
                  {formatPriceExact(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="mt-4 flex gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5">
                <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">Note: </span>
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Contact vendor via WhatsApp ────────────────────────── */}
        <div className="rounded-[28px] border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border/60 px-7 py-5 sm:px-8">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
              <MessageCircle className="size-4 text-primary" />
            </div>
            <h2 className="font-heading text-base font-bold sm:text-lg">
              Contact vendor
            </h2>
          </div>

          <div className="px-7 py-5 sm:px-8">
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Message the vendor on WhatsApp for any updates or questions about
              your order.
            </p>
            <WhatsAppButton
              vendorPhone={order.vendorWhatsappNumber}
              status={order.status}
              order={{
                orderId: order.orderId,
                customerName: order.customerName,
                items: order.items,
                total: order.totalAmount,
                notes: order.notes ?? undefined,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
              }}
            />
          </div>
        </div>

        {/* ── Feedback Modal for completed orders ────────────────── */}
        {order && (
          <FeedbackModal
            open={showFeedbackModal}
            onOpenChange={setShowFeedbackModal}
            orderId={orderId}
            vendorName={order.vendorName}
            vendorId={order.vendorId}
          />
        )}
      </div>
    </main>
  )
}
