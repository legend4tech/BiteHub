"use client"

import { formatPrice, formatPriceExact } from "@/lib/format"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { getSchoolName, getCampusName } from "@/lib/config/campus"
import { useRouter } from "next/navigation"
import { AvailableRewards } from "./AvailableRewards"
import { PromoCodeInput } from "./PromoCodeInput"
import type { CartState } from "@/hooks/useCart"

interface OrderSummaryCardProps {
  cart: {
    items: Array<{
      quantity: number
      menuItem: { id: string; name: string; priceInKobo: number }
    }>
    defaultDeliveryFeeInKobo: number
  }
  total: number
  serviceFeeInKobo: number
  finalTotal: number
  loading: boolean
  isRedirecting?: boolean
  redirectMessage?: string | null
  isSyncing: boolean
  selectedLocation: string | undefined
  isValidLocation: boolean
  noZonesAvailable?: boolean
  isCrossCampus?: boolean
  isCrossSchool?: boolean
  vendorCampus?: string
  vendorSchool?: string
  serverError?: string | null
  requiresLogin?: boolean
  requiresSignup?: boolean
  applyVoucher: (code: string, menuItemId: string) => void
  removeVoucher: () => void
  appliedVoucherCode: string | null
  appliedVoucherMenuItemId: string | null
  appliedPromoCode?: string | null
  promoDiscountInKobo?: number
  applyPromo?: (code: string, discountInKobo: number) => void
  removePromo?: () => void
  itemSubtotal: number
  useBHC: boolean
  setUseBHC: (value: boolean) => void
  customerWallet: { wallet: { promoBalanceInKobo: number } } | null
  isInsufficientFunds?: boolean
}

export function OrderSummaryCard({
  cart,
  total,
  serviceFeeInKobo,
  finalTotal,
  loading,
  isRedirecting = false,
  redirectMessage = null,
  isSyncing,
  isValidLocation,
  noZonesAvailable,
  isCrossCampus,
  isCrossSchool,
  vendorCampus,
  vendorSchool,
  serverError,
  requiresLogin,
  requiresSignup,
  applyVoucher,
  removeVoucher,
  appliedVoucherCode,
  appliedVoucherMenuItemId,
  appliedPromoCode,
  promoDiscountInKobo = 0,
  applyPromo,
  removePromo,
  itemSubtotal,
  useBHC,
  setUseBHC,
  customerWallet,
  isInsufficientFunds,
}: OrderSummaryCardProps) {
  const router = useRouter()

  const promoBalance = customerWallet?.wallet?.promoBalanceInKobo ?? 0
  const bhcDiscount =
    useBHC && promoBalance > 0 ? Math.min(promoBalance, itemSubtotal) : 0
  const discountedTotal = finalTotal - bhcDiscount

  const voucherDiscountInKobo = appliedVoucherMenuItemId
    ? cart.items.find((ci) => ci.menuItem.id === appliedVoucherMenuItemId)
        ?.menuItem.priceInKobo || 0
    : 0
  const foodSubtotal = Math.max(0, total - voucherDiscountInKobo)

  return (
    <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 font-heading text-xl font-semibold">Order Summary</h2>

      <div className="mb-6 space-y-4">
        {cart.items.map((ci) => {
          const isVoucherApplied = appliedVoucherMenuItemId === ci.menuItem.id
          const itemOriginalPrice = ci.menuItem.priceInKobo * ci.quantity
          const itemDiscountedPrice = isVoucherApplied
            ? ci.menuItem.priceInKobo * (ci.quantity - 1)
            : itemOriginalPrice

          return (
            <div
              key={ci.menuItem.id}
              className="flex justify-between gap-4 text-sm"
            >
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground">
                  {ci.quantity}x
                </span>
                <span className="font-medium">{ci.menuItem.name}</span>
              </div>
              <div className="flex flex-col items-end">
                {isVoucherApplied ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground line-through">
                      {formatPrice(itemOriginalPrice)}
                    </span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary shadow-sm">
                      {itemDiscountedPrice === 0
                        ? "FREE"
                        : formatPrice(itemDiscountedPrice)}
                    </span>
                  </div>
                ) : (
                  <span className="font-bold">
                    {formatPrice(itemOriginalPrice)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mb-6 space-y-3 border-t border-border pt-6 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Items Subtotal</span>
          <div className="flex items-center gap-2">
            {appliedVoucherMenuItemId && (
              <span className="text-xs line-through opacity-70">
                {formatPriceExact(total)}
              </span>
            )}
            <span className="font-medium text-foreground">
              {formatPriceExact(foodSubtotal)}
            </span>
          </div>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery Fee</span>
          <span>
            {noZonesAvailable ? (
              <span className="text-xs text-primary">
                {isCrossCampus ? "Wrong campus" : "Not configured"}
              </span>
            ) : isValidLocation ? (
              (cart.defaultDeliveryFeeInKobo ?? 0) === 0 ? (
                "Free"
              ) : (
                formatPriceExact(cart.defaultDeliveryFeeInKobo ?? 0)
              )
            ) : (
              "Select location"
            )}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Service Fee</span>
          <span>{formatPriceExact(serviceFeeInKobo)}</span>
        </div>
        {useBHC && promoBalance > 0 && (
          <div className="flex justify-between font-medium text-primary">
            <span>BiteHub Coins Applied</span>
            <span>-{formatPriceExact(bhcDiscount)}</span>
          </div>
        )}
        {promoDiscountInKobo > 0 && appliedPromoCode && (
          <div className="flex justify-between font-medium text-primary">
            <span>Promo Code ({appliedPromoCode})</span>
            <span>-{formatPriceExact(promoDiscountInKobo)}</span>
          </div>
        )}
        {(useBHC || appliedVoucherCode || appliedPromoCode) && (
          <div className="pt-2 text-[11px] leading-tight font-medium text-muted-foreground/80 italic">
            * Rewards and Promo discounts apply to the cost of your items and
            require Wallet payment.
          </div>
        )}
      </div>

      {applyPromo && removePromo && (
        <div className="mb-4">
          <PromoCodeInput
            cart={cart as unknown as CartState}
            appliedPromoCode={appliedPromoCode ?? null}
            promoDiscountInKobo={promoDiscountInKobo}
            onApplyPromo={applyPromo}
            onRemovePromo={removePromo}
            appliedVoucherCode={appliedVoucherCode}
            vendorCampus={vendorCampus}
            vendorSchool={vendorSchool}
          />
        </div>
      )}

      <AvailableRewards
        cart={cart as never}
        customerWallet={customerWallet}
        applyVoucher={applyVoucher}
        removeVoucher={removeVoucher}
        appliedVoucherCode={appliedVoucherCode}
        appliedPromoCode={appliedPromoCode}
        useBHC={useBHC}
        setUseBHC={setUseBHC}
        finalTotalWithoutBHC={itemSubtotal}
      />

      <div className="mb-6 flex justify-between border-t border-border pt-6 font-heading text-xl font-bold">
        <span>Total</span>
        <div className="flex flex-col items-end gap-1">
          {bhcDiscount > 0 ? (
            <>
              <span className="text-sm text-muted-foreground line-through opacity-70">
                {formatPriceExact(finalTotal)}
              </span>
              <span className="rounded-lg bg-primary/10 px-3 py-1 text-primary shadow-sm">
                {formatPriceExact(discountedTotal)}
              </span>
            </>
          ) : (
            <span className="text-primary">{formatPriceExact(finalTotal)}</span>
          )}
        </div>
      </div>

      {serverError && (
        <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-4 text-destructive">
          <p className="text-center leading-tight font-medium">{serverError}</p>
          {requiresLogin && (
            <div className="mt-1 flex w-full flex-col gap-2">
              {requiresSignup ? (
                <Button
                  type="button"
                  variant="hero"
                  className="w-full"
                  onClick={() =>
                    router.push("/customer/signup?redirect=/checkout")
                  }
                >
                  Create Free Account
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  className="w-full"
                  onClick={() =>
                    router.push("/customer/login?redirect=/checkout")
                  }
                >
                  Log in to continue
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {isInsufficientFunds ? (
        <Button
          type="button"
          variant="destructive"
          size="xl"
          className="w-full text-lg"
          onClick={() => router.push("/customer/wallet")}
        >
          Insufficient Funds - Top Up
        </Button>
      ) : (
        <Button
          type="submit"
          variant="hero"
          size="xl"
          className="w-full text-lg"
          disabled={
            loading ||
            isRedirecting ||
            isSyncing ||
            cart.items.length === 0 ||
            !isValidLocation ||
            noZonesAvailable
          }
        >
          {isRedirecting && redirectMessage ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span>{redirectMessage}</span>
            </span>
          ) : loading || isSyncing ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            `Pay ${formatPriceExact(discountedTotal)}`
          )}
        </Button>
      )}

      {isCrossCampus && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          This vendor is in{" "}
          {isCrossSchool && vendorSchool
            ? `${getSchoolName(vendorSchool)} `
            : ""}
          {vendorSchool && vendorCampus
            ? getCampusName(vendorSchool, vendorCampus)
            : "a different campus"}{" "}
          and can&apos;t deliver to you.{" "}
          <Link
            href="/menu"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Browse vendors on your campus.
          </Link>
        </p>
      )}
    </div>
  )
}
