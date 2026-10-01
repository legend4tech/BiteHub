"use client"

import { useState } from "react"
import { Gift, X, Sparkles } from "lucide-react"
import { useCustomerVouchers } from "@/hooks/customer/useCustomerVouchers"
import { useCart } from "@/hooks/useCart"
import { Button } from "@/components/ui/button"

export function CheckoutVoucherBanner() {
  const { data: vouchers, isLoading } = useCustomerVouchers()
  const { cart, applyVoucher, removeVoucher, appliedVoucherCode } = useCart()
  const [show, setShow] = useState(true)

  // Find if any active voucher matches items in the current cart
  const applicableVoucher = vouchers?.find(
    (v: {
      menuItemId: string
      code: string
      menuItem?: { name: string } | null
    }) => cart.items.some((item) => item.menuItem.id === v.menuItemId)
  )

  if (isLoading || !applicableVoucher || !show) return null

  const isApplied = appliedVoucherCode === applicableVoucher.code

  return (
    <div
      className={`relative mb-4 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent p-4 shadow-sm ${!isApplied ? "animate-[shake_3s_ease-in-out_infinite]" : ""}`}
    >
      {/* Decorative gamification elements */}
      <div className="absolute -top-4 -right-4 opacity-10">
        <Gift className="size-24 text-primary" />
      </div>

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h4 className="font-bold text-primary">Free Meal Unlocked! 🎉</h4>
            <p className="text-sm text-muted-foreground">
              You have a voucher for a free{" "}
              <strong>{applicableVoucher.menuItem?.name || "Meal"}</strong>.
            </p>

            {!isApplied ? (
              <Button
                onClick={() => applyVoucher(applicableVoucher.code)}
                size="sm"
                className="mt-2 rounded-full font-bold shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                Apply to Cart
              </Button>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  Voucher Applied ✓
                </span>
                <button
                  onClick={() => removeVoucher()}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {!isApplied && (
          <button
            onClick={() => setShow(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
