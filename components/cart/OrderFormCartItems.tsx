"use client"

import { Minus, Plus, X, Clock } from "lucide-react"
import { formatPrice } from "@/lib/format"
import { useCart } from "@/hooks/useCart"
import { formatPrepTime } from "@/lib/format"

interface OrderFormCartItemsProps {
  loading: boolean
}

export function OrderFormCartItems({ loading }: OrderFormCartItemsProps) {
  const {
    cart,
    updateQuantity,
    removeItem,
    total,
    maxPrepItem,
    isPreorderCart,
  } = useCart()

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Your items</p>
      {cart.items.map((ci) => (
        <div
          key={ci.menuItem.id}
          className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3"
        >
          <p className="flex-1 text-sm leading-snug font-medium">
            {ci.menuItem.name}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={loading || ci.quantity <= 1}
              onClick={() => updateQuantity(ci.menuItem.id, ci.quantity - 1)}
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-5 text-center text-sm font-bold">
              {ci.quantity}
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={() => updateQuantity(ci.menuItem.id, ci.quantity + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Plus className="size-3" />
            </button>
          </div>
          <p className="w-20 text-right text-sm font-bold">
            {formatPrice(ci.menuItem.price * ci.quantity)}
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => removeItem(ci.menuItem.id)}
            className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}

      {isPreorderCart && maxPrepItem ? (
        <div className="flex flex-col gap-1 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
          <div className="flex items-center gap-2 font-bold">
            <Clock className="size-4" />
            <span className="capitalize">
              Pre-order:{" "}
              {formatPrepTime(
                maxPrepItem.prepTimeValue,
                maxPrepItem.prepTimeUnit
              )}
            </span>
          </div>
          <p className="text-xs font-medium text-primary/80">
            Your order contains pre-order items. The estimated readiness time
            for this entire order is{" "}
            {formatPrepTime(
              maxPrepItem.prepTimeValue,
              maxPrepItem.prepTimeUnit
            )}
            .
          </p>
        </div>
      ) : maxPrepItem ? (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
          <Clock className="size-4 animate-pulse" />
          <span className="font-medium">
            Estimated prep time:{" "}
            {formatPrepTime(
              maxPrepItem.prepTimeValue,
              maxPrepItem.prepTimeUnit
            )}
          </span>
        </div>
      ) : cart.vendorPrepTime ? (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
          <Clock className="size-4 animate-pulse" />
          <span className="font-medium">
            Estimated prep time: {cart.vendorPrepTime}
          </span>
        </div>
      ) : null}
    </div>
  )
}
