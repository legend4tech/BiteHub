"use client"

import { formatPrice, formatPriceExact } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface OrderSummaryCardProps {
  cart: {
    items: Array<{
      quantity: number
      menuItem: { id: string; name: string; price: number }
    }>
    vendorDeliveryFee: number
  }
  total: number
  serviceFee: number
  finalTotal: number
  loading: boolean
  isSyncing: boolean
  selectedLocation: string | undefined
}

export function OrderSummaryCard({
  cart,
  total,
  serviceFee,
  finalTotal,
  loading,
  isSyncing,
  selectedLocation,
}: OrderSummaryCardProps) {
  return (
    <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 font-heading text-xl font-semibold">Order Summary</h2>

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
        <span className="text-primary">{formatPriceExact(finalTotal)}</span>
      </div>

      <Button
        type="submit"
        variant="hero"
        size="xl"
        className="w-full text-lg"
        disabled={
          loading || isSyncing || cart.items.length === 0 || !selectedLocation
        }
      >
        {loading || isSyncing ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          `Pay ${formatPriceExact(finalTotal)}`
        )}
      </Button>
    </div>
  )
}
