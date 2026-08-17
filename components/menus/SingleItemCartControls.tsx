"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Minus, ShoppingBag } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import type { MenuItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { isItemAvailableToday } from "@/lib/format"

interface SingleItemCartControlsProps {
  item: MenuItem
  vendorIsActive?: boolean
}

export function SingleItemCartControls({
  item,
  vendorIsActive = true,
}: SingleItemCartControlsProps) {
  const { cart, addItem, updateQuantity, isDifferentVendor, clearAndAdd } =
    useCart()
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null)

  const cartEntry = cart.items.find((ci) => ci.menuItem.id === item.id)
  const qty = cartEntry?.quantity ?? 0

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`

  const isAvailableToday = item.isPreorder
    ? true
    : isItemAvailableToday(item.availableDays)

  const isScheduled = !item.isPreorder && item.availableFrom && item.availableTo
  const isOffSchedule =
    isScheduled &&
    (currentTime < item.availableFrom! || currentTime > item.availableTo!)

  const isPreorderClosed = Boolean(
    item.isPreorder &&
    item.preorderEndDate &&
    now > new Date(item.preorderEndDate)
  )

  const isSoldOut =
    item.quantityAvailable !== null &&
    item.quantityAvailable !== undefined &&
    item.quantityAvailable <= 0

  const isCurrentlyAvailable =
    item.isAvailable &&
    isAvailableToday &&
    !isSoldOut &&
    !isOffSchedule &&
    !isPreorderClosed &&
    vendorIsActive

  let disabledReason = "Unavailable"
  if (!vendorIsActive) disabledReason = "Vendor Closed"
  else if (!item.isAvailable) disabledReason = "Unlisted"
  else if (!isAvailableToday) disabledReason = "Unavailable Today"
  else if (isSoldOut) disabledReason = "Sold Out"
  else if (isPreorderClosed) disabledReason = "Preorder Closed"
  else if (isOffSchedule) disabledReason = "Closed for now"

  const disabled = !isCurrentlyAvailable

  const handleAdd = () => {
    if (disabled) return
    if (isDifferentVendor(item)) {
      setConflictItem(item)
      return
    }
    const result = addItem(item)
    if (result && !result.success) {
      toast.error(result.error)
    }
  }

  const handleClearAndAdd = () => {
    if (!conflictItem) return
    clearAndAdd(conflictItem)
    setConflictItem(null)
  }

  return (
    <>
      {qty > 0 && disabled ? (
        <div className="flex w-full items-center justify-between rounded-2xl border-2 border-destructive bg-destructive/5 px-4 py-3 sm:w-auto">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-destructive">
              {disabledReason}
            </span>
            <span className="text-xs text-muted-foreground">
              Please remove this item
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => updateQuantity(item.id, 0)}
          >
            Remove
          </Button>
        </div>
      ) : qty === 0 ? (
        <Button
          size="xl"
          variant="hero"
          className="w-full px-8 text-base font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          onClick={handleAdd}
          disabled={disabled}
        >
          <ShoppingBag className="mr-2 size-5" />
          {disabled ? disabledReason : "Add to Cart"}
        </Button>
      ) : (
        <div className="flex w-full items-center rounded-2xl border-2 border-primary bg-card p-1 shadow-xl shadow-primary/10 sm:w-[200px]">
          <button
            onClick={() => updateQuantity(item.id, qty - 1)}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary/20 active:scale-95"
          >
            <Minus className="size-5" />
          </button>
          <span className="flex-1 text-center text-lg font-bold tabular-nums">
            {qty}
          </span>
          <button
            onClick={() => {
              const result = addItem(item)
              if (result && !result.success) {
                toast.error(result.error)
              }
            }}
            disabled={disabled}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-5" />
          </button>
        </div>
      )}

      {/* Cross-vendor conflict dialog */}
      {conflictItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setConflictItem(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-bold">
              Start a new cart?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your cart currently has items from a different vendor. Adding{" "}
              <strong>{conflictItem.name}</strong> will clear your current cart.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConflictItem(null)}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Keep cart
              </button>
              <button
                onClick={handleClearAndAdd}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                Clear & add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
