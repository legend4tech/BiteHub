"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { OrderStatusTracker } from "@/components/cart/OrderStatusTracker"
import { WhatsAppButton } from "@/components/cart/WhatsAppButton"
import { StatusBadge } from "@/components/vendor/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import type { OrderStatus } from "@/lib/types"
import { useOrder } from "@/hooks/queries/useOrder"

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  // Fetch order using React Query
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useOrder(orderId)

  const handleRefresh = async () => {
    await refetch()
    setLastRefreshed(new Date())
  }

  // Loading state
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

  // Error states
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

    // Server error
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
    <main className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />

      <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
        {/* Order ID card */}
        <div className="rounded-3xl border border-border bg-card p-8">
          <p className="text-sm font-semibold tracking-wider text-primary uppercase">
            Order placed!
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold">
            {order.orderId}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            from{" "}
            <span className="font-semibold text-foreground">
              {order.vendorName}
            </span>
            {" · "}
            {new Date(order.createdAt).toLocaleDateString("en-NG", {
              month: "short",
              day: "numeric",
            })}{" "}
            {new Date(order.createdAt).toLocaleTimeString("en-NG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div className="mt-4">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Status tracker */}
        <div className="rounded-3xl border border-border bg-card p-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold">Order status</h2>
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw
                className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`}
              />
              Refresh ·{" "}
              {lastRefreshed.toLocaleTimeString("en-NG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          </div>
          <OrderStatusTracker status={order.status} />
        </div>

        {/* Items */}
        <div className="rounded-3xl border border-border bg-card p-8">
          <h2 className="mb-4 font-heading text-lg font-bold">Your items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.menuItemId}
                className="flex justify-between text-sm"
              >
                <span>
                  {item.name}{" "}
                  <span className="text-muted-foreground">
                    ×{item.quantity}
                  </span>
                </span>
                <span className="font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-bold">
            <span>Total</span>
            <span className="text-primary">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
          {order.notes && (
            <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Note: </span>
              {order.notes}
            </div>
          )}
        </div>

        {/* WhatsApp */}
        <div className="space-y-3 rounded-3xl border border-border bg-card p-8">
          <h2 className="font-heading text-lg font-bold">Contact vendor</h2>
          <p className="text-sm text-muted-foreground">
            Send your order details to the vendor via WhatsApp to confirm and
            get updates.
          </p>
          <WhatsAppButton
            vendorPhone={order.vendorWhatsappNumber}
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
    </main>
  )
}
