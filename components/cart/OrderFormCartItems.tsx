"use client"

import { Minus, Plus, X, Clock } from "lucide-react"
import {
  formatPrice,
  isItemAvailableToday,
  formatPrepTime,
  formatPreorderDeliveryDate,
} from "@/lib/format"
import { useCart } from "@/hooks/useCart"
import { toast } from "sonner"

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
      {cart.items.map((ci) => {
        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        const isAvailableToday = ci.menuItem.isPreorder
          ? true
          : isItemAvailableToday(ci.menuItem.availableDays)
        const isScheduled =
          !ci.menuItem.isPreorder &&
          ci.menuItem.availableFrom &&
          ci.menuItem.availableTo
        const isOffSchedule =
          isScheduled &&
          (currentTime < ci.menuItem.availableFrom! ||
            currentTime > ci.menuItem.availableTo!)
        const isPreorderClosed = Boolean(
          ci.menuItem.isPreorder &&
          ci.menuItem.preorderEndDate &&
          now > new Date(ci.menuItem.preorderEndDate)
        )
        const isSoldOut =
          ci.menuItem.quantityAvailable !== null &&
          ci.menuItem.quantityAvailable !== undefined &&
          ci.menuItem.quantityAvailable <= 0
        const isCurrentlyAvailable =
          ci.menuItem.isAvailable &&
          isAvailableToday &&
          !isSoldOut &&
          !isOffSchedule &&
          !isPreorderClosed

        const reachedMax =
          ci.menuItem.quantityAvailable !== null &&
          ci.menuItem.quantityAvailable !== undefined &&
          ci.quantity >= ci.menuItem.quantityAvailable

        return (
          <div
            key={ci.menuItem.id}
            className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-sm leading-snug font-medium">
                {ci.menuItem.name}
              </p>
              {!isCurrentlyAvailable && (
                <span className="text-[10px] font-bold tracking-wider text-destructive uppercase">
                  Unavailable
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
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
                disabled={loading || !isCurrentlyAvailable || reachedMax}
                onClick={() => {
                  const result = updateQuantity(ci.menuItem.id, ci.quantity + 1)
                  if (result && !result.success) {
                    toast.error(result.error)
                  }
                }}
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Plus className="size-3" />
              </button>
            </div>
            <p className="w-16 shrink-0 text-right text-sm font-bold">
              {formatPrice(ci.menuItem.price * ci.quantity)}
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => removeItem(ci.menuItem.id)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}

      {isPreorderCart && maxPrepItem ? (
        <div className="flex flex-col gap-1 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
          <div className="flex items-center gap-2 font-bold">
            <Clock className="size-4" />
            <span className="capitalize">
              {maxPrepItem.preorderDeliveryInfo ||
                (maxPrepItem.preorderEndDate
                  ? formatPreorderDeliveryDate(maxPrepItem.preorderEndDate)
                  : "Delivery as scheduled by vendor")}
            </span>
          </div>
          <p className="text-xs font-medium text-primary/80">
            This cart contains pre-order items. Your entire order will be
            fulfilled based on the pre-order schedule above.
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
