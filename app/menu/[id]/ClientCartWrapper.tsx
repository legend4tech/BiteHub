"use client"

import { useState } from "react"
import { CartSummary } from "@/components/cart/CartSummary"
import { OrderForm } from "@/components/cart/OrderForm"

export function ClientCartWrapper() {
  const [orderFormOpen, setOrderFormOpen] = useState(false)

  return (
    <>
      {/* Floating cart */}
      <CartSummary onCheckout={() => setOrderFormOpen(true)} />

      {/* Order form */}
      <OrderForm open={orderFormOpen} onClose={() => setOrderFormOpen(false)} />
    </>
  )
}
