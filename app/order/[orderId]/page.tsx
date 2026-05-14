"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { OrderStatusTracker } from "@/components/cart/OrderStatusTracker"
import { WhatsAppButton } from "@/components/cart/WhatsAppButton"
import { StatusBadge } from "@/components/vendor/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { RefreshCw, Home, ShoppingBag, MessageCircle, ChevronRight, Receipt, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import type { OrderStatus } from "@/lib/types"
import { useOrder } from "@/hooks/queries/useOrder"
import { toast } from "sonner"

const FEEDBACK_SNOOZE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (easily editable)

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  vendorName: string;
  vendorId: string;
}

function FeedbackModal({ open, onOpenChange, orderId, vendorName, vendorId }: FeedbackModalProps) {
  const [platformRating, setPlatformRating] = useState(0)
  const [platformComments, setPlatformComments] = useState("")
  const [vendorRating, setVendorRating] = useState(0)
  const [vendorComments, setVendorComments] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedbackStep, setFeedbackStep] = useState(1)
  const [isAnonymous, setIsAnonymous] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[550px] rounded-[28px]">
        <AlertDialogHeader>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Step {feedbackStep} of 2
            </span>
          </div>
          <AlertDialogTitle className="font-heading text-xl font-bold">
            {feedbackStep === 1 ? "Rate the Platform" : "Rate the Vendor"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {feedbackStep === 1 
              ? "How was your experience using CampusBites? We'd love to hear your thoughts!"
              : `How was your order and service from ${vendorName}?`}
          </AlertDialogDescription>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-in-out" 
              style={{ width: feedbackStep === 1 ? "50%" : "100%" }}
            />
          </div>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => feedbackStep === 1 ? setPlatformRating(star) : setVendorRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-7 transition-colors ${
                      (hoveredRating || (feedbackStep === 1 ? platformRating : vendorRating)) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Comments</label>
            <textarea
              value={feedbackStep === 1 ? platformComments : vendorComments}
              onChange={(e) => feedbackStep === 1 ? setPlatformComments(e.target.value) : setVendorComments(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              rows={4}
              placeholder={feedbackStep === 1 ? "Tell us what you liked or what we can improve..." : "How was the quality? Was everything delivered on time?"}
            />
          </div>

          {feedbackStep === 2 && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="size-4 rounded border-border"
              />
              <label htmlFor="isAnonymous" className="text-sm text-muted-foreground select-none">
                Submit review anonymously to the vendor
              </label>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3">
          {feedbackStep === 1 ? (
            <AlertDialogCancel 
              onClick={() => {
                localStorage.setItem(`feedback_snoozed_${orderId}`, new Date().getTime().toString());
                onOpenChange(false);
              }} 
              className="w-full sm:w-auto"
            >
              Maybe later
            </AlertDialogCancel>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setFeedbackStep(1)} 
              className="w-full sm:w-auto"
            >
              Back
            </Button>
          )}
          
          {feedbackStep === 1 ? (
            <Button 
              onClick={() => setFeedbackStep(2)} 
              disabled={platformRating === 0}
              className="w-full sm:w-auto"
            >
              Next
            </Button>
          ) : (
            <AlertDialogAction 
              onClick={async () => {
                try {
                  const response = await fetch("/api/feedback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId,
                      platform: { rating: platformRating, comments: platformComments },
                      vendor: { vendorId: vendorId, rating: vendorRating, comments: vendorComments, isAnonymous },
                    }),
                  });
                  
                  if (response.ok) {
                    toast.success("Feedback submitted! Thank you.");
                    localStorage.setItem(`feedback_handled_${orderId}`, "true");
                    onOpenChange(false);
                  } else {
                    const data = await response.json();
                    toast.error(data.error || "Failed to submit feedback.");
                  }
                } catch (error) {
                  toast.error("An error occurred.");
                }
              }}
              disabled={vendorRating === 0}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Submit Feedback
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useOrder(orderId)

  useEffect(() => {
    if (order?.status === "completed") {
      const handled = localStorage.getItem(`feedback_handled_${orderId}`)
      const snoozedAt = localStorage.getItem(`feedback_snoozed_${orderId}`)
      
      const now = new Date().getTime()
      const isSnoozed = snoozedAt && (now - parseInt(snoozedAt)) < FEEDBACK_SNOOZE_DURATION
      
      if (!handled && !isSnoozed) {
        setShowFeedbackModal(true)
      }
    }
  }, [order?.status, orderId])

  const handleRefresh = async () => {
    await refetch()
    setLastRefreshed(new Date())
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
    const isNotFound = (error as any)?.response?.status === 404

    if (isNotFound) {
      return (
        <main className="min-h-screen bg-background text-foreground">
          <Navbar />
          <EmptyState
            title="Order not found"
            description={`We couldn't find an order with ID "${orderId}". Please check the ID or try again later.`}
            action={{
              label: "Go home",
              href: "/",
              icon: <Home className="size-4" />,
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
        <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-4 px-4 py-10 sm:px-6 sm:py-14">

        {/* ── Hero card: Order confirmed ─────────────────────────── */}
        <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
          {/* Coloured top strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

          <div className="p-7 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Label */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-widest text-primary uppercase">
                    <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                    Order placed
                  </span>
                </div>

                {/* Order ID */}
                <h1 className="mt-3 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {order.orderId}
                </h1>

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
                    at{" "}
                    {new Date(order.createdAt).toLocaleTimeString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>

              {/* Icon bubble */}
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <ShoppingBag className="size-6 text-primary" />
              </div>
            </div>

            {/* Status badge */}
            <div className="mt-5 pt-5 border-t border-border/60">
              <StatusBadge status={order.status} />
            </div>
          </div>
        </div>

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

          <OrderStatusTracker status={order.status} />
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
              {order.items.map((item, i) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
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

            {/* Total row */}
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-primary/8 px-4 py-3.5">
              <span className="text-sm font-bold">Total</span>
              <span className="text-lg font-extrabold text-primary tabular-nums">
                {formatPrice(order.totalAmount)}
              </span>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="mt-4 flex gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5">
                <span className="mt-0.5 shrink-0 text-base">📝</span>
                <p className="text-sm text-muted-foreground leading-relaxed">
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
              Send your order details directly to the vendor on WhatsApp to
              confirm and get real-time updates.
            </p>
            <WhatsAppButton
              vendorPhone={order.vendorWhatsappNumber}
              status={order.status}
              order={{
                orderId: order.orderId,
                customerName: order.customerName,
                items: order.items,
                total: order.totalAmount,
                notes: order.notes,
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

        {/* ── Back home link ─────────────────────────────────────── */}
        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="size-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}