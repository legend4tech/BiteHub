"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Tag,
  CheckCircle2,
  X,
  Loader2,
  Gift,
  Wallet,
  ArrowRight,
  UserPlus,
  LogIn,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatPriceExact } from "@/lib/format"
import { useValidatePromoCode } from "@/hooks/customer/useCustomerPromo"
import { useCampus } from "@/components/providers/CampusProvider"
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
  const router = useRouter()
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user?.email

  const [inputCode, setInputCode] = useState("")
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { schoolId, campusId } = useCampus()
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

    // Intercept guest attempt with a sleek auth dialog
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    const payload = {
      code: trimmed,
      vendorId: cart.vendorId,
      campus: vendorCampus || campusId,
      school: vendorSchool || schoolId,
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
      const axiosErr = err as {
        response?: { data?: { error?: string; requiresSignup?: boolean } }
      }
      if (axiosErr.response?.data?.requiresSignup) {
        setShowAuthDialog(true)
        return
      }
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
    <>
      <div className="rounded-xl border border-border bg-card/60 p-3.5 backdrop-blur-sm transition-all">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Have a Promo Code?
            </span>
          </div>
          {!isAuthenticated && !appliedPromoCode && (
            <span className="text-[10px] font-medium text-primary">
              Wallet Required
            </span>
          )}
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
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g. WELCOME500 or CHOP300"
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

            {/* Guest contextual prompt with 1-click Sign Up */}
            {!isAuthenticated && (
              <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Gift className="size-3.5" />
                  </div>
                  <div className="leading-tight">
                    <p className="font-semibold text-foreground">
                      Promo codes require a Wallet
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Sign up to claim discounts on your order.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="h-7 shrink-0 px-2.5 text-[11px] font-medium"
                  onClick={() =>
                    router.push("/customer/signup?redirect=/checkout")
                  }
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sleek Modal Dialog for Guest Auth */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
              <Wallet className="size-6" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Sign Up to Claim Promo Codes
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm text-muted-foreground">
              All promo code discounts and subsidies are paid directly via your{" "}
              <strong className="text-foreground">
                BiteHub Student Wallet
              </strong>
              . Create an account or sign in to activate your wallet and claim
              this discount!
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2.5">
            <Button
              type="button"
              className="w-full justify-center gap-2 py-5 text-sm font-semibold shadow-sm"
              onClick={() => {
                setShowAuthDialog(false)
                router.push("/customer/signup?redirect=/checkout")
              }}
            >
              <UserPlus className="size-4" />
              Create Free Account & Claim Discount
              <ArrowRight className="size-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2 py-5 text-sm font-medium"
              onClick={() => {
                setShowAuthDialog(false)
                router.push("/customer/login?redirect=/checkout")
              }}
            >
              <LogIn className="size-4" />
              Already have an account? Log In
            </Button>
          </div>

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setShowAuthDialog(false)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Continue checkout as guest without promo code
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
