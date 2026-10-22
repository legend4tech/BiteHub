"use client"

import { useState } from "react"
import { Tag, CheckCircle2, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatPriceExact } from "@/lib/format"
import { useValidatePromoCode } from "@/hooks/customer/useCustomerPromo"
import { toast } from "sonner"
import type { CartState } from "@/hooks/useCart"

interface PromoCodeInputProps {
  cart: CartState
  appliedPromoCode: string | null
  promoDiscountInKobo: number
  onApplyPromo: (code: string, discountInKobo: number) => void
  onRemovePromo: () => void
  appliedVoucherCode?: string | null
  vendorCampus?: string
  vendorSchool?: string
}

export function PromoCodeInput({
  cart,
  appliedPromoCode,
  promoDiscountInKobo,
  onApplyPromo,
  onRemovePromo,
  appliedVoucherCode,
  vendorCampus,
  vendorSchool,
}: PromoCodeInputProps) {
  const [inputCode, setInputCode] = useState("")
  const validateMutation = useValidatePromoCode()

  const handleApply = async () => {
    const trimmed = inputCode.trim().toUpperCase()
    if (!trimmed) {
      toast.error("Please enter a promo code")
      return
    }

    if (!cart.vendorId || cart.items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    const payload = {
      code: trimmed,
      vendorId: cart.vendorId,
      campus: vendorCampus,
      school: vendorSchool,
      items: cart.items.map((i) => ({
        menuItemId: i.menuItem.id,
        priceInKobo: i.menuItem.priceInKobo,
        quantity: i.quantity,
      })),
    }

    try {
      const result = await validateMutation.mutateAsync(payload)
      if (result.valid) {
        onApplyPromo(result.code, result.discountAmountInKobo)
        setInputCode("")
        toast.success(
          `Promo code ${result.code} applied! (-${formatPriceExact(result.discountAmountInKobo)})`
        )
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const message =
        axiosErr.response?.data?.error || "Failed to validate promo code"
      toast.error(message)
    }
  }

  const handleRemove = () => {
    onRemovePromo()
    toast.info("Promo code removed")
  }

  return (
    <div className="rounded-xl border border-border bg-card/60 p-3.5 backdrop-blur-sm transition-all">
      <div className="mb-2 flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Have a Promo Code?
        </span>
      </div>

      {appliedPromoCode ? (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <span className="font-mono font-bold text-foreground">
                {appliedPromoCode}
              </span>
              <span className="ml-2 font-medium text-primary">
                -{formatPriceExact(promoDiscountInKobo)}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove promo code</span>
          </Button>
        </div>
      ) : appliedVoucherCode ? (
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>Voucher applied. Remove voucher to use a promo code.</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="e.g. PASTOR50 or CHOP300"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleApply()
              }
            }}
            disabled={validateMutation.isPending}
            className="h-9 font-mono text-sm uppercase"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApply}
            disabled={validateMutation.isPending || !inputCode.trim()}
            className="h-9 border-primary/30 px-4 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            {validateMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Apply"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
