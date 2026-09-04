"use client"

import { useState } from "react"
import { CartSummary } from "@/components/cart/CartSummary"
import { CartSheet } from "@/components/cart/CartSheet"

export function ClientCartWrapper() {
  const [cartSheetOpen, setCartSheetOpen] = useState(false)

  return (
    <>
      {/* Floating cart */}
      <CartSummary onCheckout={() => setCartSheetOpen(true)} />

      {/* Cart Sheet */}
      <CartSheet open={cartSheetOpen} onClose={() => setCartSheetOpen(false)} />
    </>
  )
}
