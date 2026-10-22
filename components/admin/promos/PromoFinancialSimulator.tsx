"use client"

import { useState } from "react"
import { Calculator, HelpCircle, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PromoFinancialSimulatorProps {
  discountType: "FIXED_AMOUNT" | "PERCENTAGE"
  discountInNaira: number
  discountPercentage?: number | null
  maxDiscountInNaira?: number | null
  budgetInNaira: number
  minOrderValueInNaira?: number | null
}

export function PromoFinancialSimulator({
  discountType,
  discountInNaira,
  discountPercentage,
  maxDiscountInNaira,
  budgetInNaira,
  minOrderValueInNaira,
}: PromoFinancialSimulatorProps) {
  const [testOrderValue, setTestOrderValue] = useState<number>(3500)

  const budget = Number(budgetInNaira) || 0
  const flatDiscount = Number(discountInNaira) || 0
  const percentage = Number(discountPercentage) || 0
  const customCap =
    maxDiscountInNaira !== null && maxDiscountInNaira !== undefined
      ? Number(maxDiscountInNaira)
      : null
  const minOrder = Number(minOrderValueInNaira) || 0

  // Calculate projected minimum subsidy per order
  let minSubsidyPerOrder = 0

  if (discountType === "FIXED_AMOUNT") {
    minSubsidyPerOrder = flatDiscount
  } else {
    // Min discount assuming minOrderValue or small order (₦1,000)
    const baseOrder = minOrder > 0 ? minOrder : 1000
    minSubsidyPerOrder = Math.round(baseOrder * (percentage / 100))
    if (customCap !== null && customCap > 0) {
      minSubsidyPerOrder = Math.min(minSubsidyPerOrder, customCap)
    }
  }

  // Estimated orders supported by this budget
  let supportedOrdersText = "0 orders"
  if (budget > 0) {
    if (discountType === "FIXED_AMOUNT" && flatDiscount > 0) {
      const count = Math.floor(budget / flatDiscount)
      supportedOrdersText = `Exactly ${count.toLocaleString()} orders`
    } else if (discountType === "PERCENTAGE" && percentage > 0) {
      if (customCap !== null && customCap > 0) {
        const minOrders = Math.floor(budget / customCap)
        const maxOrders =
          minSubsidyPerOrder > 0
            ? Math.floor(budget / minSubsidyPerOrder)
            : minOrders
        supportedOrdersText =
          minOrders === maxOrders
            ? `~${minOrders.toLocaleString()} orders`
            : `${minOrders.toLocaleString()} – ${maxOrders.toLocaleString()} orders`
      } else {
        supportedOrdersText = "Variable (uncapped percentage)"
      }
    }
  }

  // Interactive Test Simulation
  let simulatedDiscount = 0
  let isUnderMinOrder = false
  if (testOrderValue < minOrder) {
    isUnderMinOrder = true
  } else {
    if (discountType === "FIXED_AMOUNT") {
      simulatedDiscount = Math.min(flatDiscount, testOrderValue)
    } else {
      const raw = Math.round(testOrderValue * (percentage / 100))
      simulatedDiscount =
        customCap !== null && customCap > 0 ? Math.min(raw, customCap) : raw
      simulatedDiscount = Math.min(simulatedDiscount, testOrderValue)
    }
  }
  const simulatedCustomerPays = Math.max(0, testOrderValue - simulatedDiscount)

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Calculator className="h-4 w-4" />
        <span>Financial Simulator & Forecast</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-border/60 bg-background/80 p-2.5">
          <span className="block font-medium text-muted-foreground">
            Max BiteHub Subsidy
          </span>
          <span className="mt-0.5 block text-base font-bold text-foreground">
            ₦{budget.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Total marketing spend cap
          </span>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/80 p-2.5">
          <span className="block font-medium text-muted-foreground">
            Projected Orders
          </span>
          <span className="mt-0.5 block truncate text-base font-bold text-primary">
            {supportedOrdersText}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Supported within budget
          </span>
        </div>
      </div>

      {discountType === "PERCENTAGE" && (
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-background/80 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subsidy Per Order:</span>
            <span className="font-semibold text-foreground">
              {percentage}%
              {customCap !== null && customCap > 0
                ? ` (Capped at ₦${customCap.toLocaleString()})`
                : " (Uncapped)"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Range for ₦1,000–₦10,000 orders:</span>
            <span className="font-mono">
              ₦
              {Math.min(
                1000 * (percentage / 100),
                customCap ?? Infinity
              ).toLocaleString()}{" "}
              – ₦
              {customCap
                ? customCap.toLocaleString()
                : (10000 * (percentage / 100)).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* What-If Live Simulator */}
      <div className="space-y-2 border-t border-primary/10 pt-3">
        <div className="flex items-center justify-between text-xs">
          <Label
            htmlFor="testOrderValue"
            className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            What-If Order Test (₦):
          </Label>
          <div className="w-24">
            <Input
              id="testOrderValue"
              type="number"
              min={0}
              step={100}
              value={testOrderValue || ""}
              onChange={(e) => setTestOrderValue(Number(e.target.value) || 0)}
              className="h-7 text-right font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-1 rounded-lg border border-border/80 bg-background p-2.5 text-xs">
          {isUnderMinOrder ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
              Below min order threshold of ₦{minOrder.toLocaleString()}.
              Discount = ₦0.
            </div>
          ) : (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>Order Total:</span>
                <span className="font-mono">
                  ₦{testOrderValue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-primary">
                <span>BiteHub Promo Discount:</span>
                <span className="font-mono">
                  -₦{simulatedDiscount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1 font-bold text-foreground">
                <span>Customer Pays:</span>
                <span className="font-mono text-primary">
                  ₦{simulatedCustomerPays.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
