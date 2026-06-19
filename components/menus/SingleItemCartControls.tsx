"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Minus, ShoppingBag } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import type { MenuItem } from "@/lib/types"
import { Button } from "@/components/ui/button"

export function SingleItemCartControls({ item }: { item: MenuItem }) {
  const { cart, addItem, updateQuantity, isDifferentVendor, clearAndAdd } =
    useCart()
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null)

  const cartEntry = cart.items.find((ci) => ci.menuItem.id === item.id)
  const qty = cartEntry?.quantity ?? 0

  const handleAdd = () => {
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
      {qty === 0 ? (
        <Button
          size="xl"
          variant="hero"
          className="w-full px-8 text-base font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
          onClick={handleAdd}
        >
          <ShoppingBag className="mr-2 size-5" />
          Add to Cart
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
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary/90 active:scale-95"
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
