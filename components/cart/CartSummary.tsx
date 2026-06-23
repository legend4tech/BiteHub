"use client"

import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"

import { formatPrice } from "@/lib/format"
import { Trash2 } from "lucide-react"

interface CartSummaryProps {
  onCheckout: () => void
}

export function CartSummary({ onCheckout }: CartSummaryProps) {
  const { count, total, isEmpty, cart, clearCart } = useCart()

  if (isEmpty) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
      <div className="flex transform-gpu flex-col overflow-hidden rounded-2xl border border-primary/30 bg-primary shadow-[0_8px_32px_-4px_rgba(var(--primary),0.35)] backdrop-blur-xl">
        {/* Subtle Header */}
        <div className="flex items-center justify-between bg-black/10 px-5 py-2 dark:bg-black/20">
          <span className="text-[11px] font-semibold tracking-wider text-primary-foreground/80 uppercase">
            Your Order
          </span>
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20"
          >
            <Trash2 className="size-3" />
            Clear
          </button>
        </div>

        {/* Main Cart Content */}
        <div className="flex items-center gap-4 px-5 pt-2 pb-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-primary-foreground">
              {count} item{count !== 1 ? "s" : ""} · {formatPrice(total)}
            </p>
            <p className="text-xs text-primary-foreground/80">
              {cart.vendorName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onCheckout}
              className="h-9 rounded-xl border-0 bg-white px-4 font-semibold text-primary shadow-none hover:bg-white/90"
            >
              <ShoppingBag className="mr-2 size-4" />
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
