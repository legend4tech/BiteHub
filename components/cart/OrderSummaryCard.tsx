"use client"

import { formatPrice, formatPriceExact } from "@/lib/format"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { getSchoolName, getCampusName } from "@/lib/config/campus"
import { useRouter } from "next/navigation"
import { AvailableRewards } from "./AvailableRewards"

interface OrderSummaryCardProps {
  cart: {
    items: Array<{
      quantity: number
      menuItem: { id: string; name: string; price: number }
    }>
    vendorDeliveryFee: number
  }
  total: number
  serviceFee: number
  finalTotal: number
  loading: boolean
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
  applyVoucher: (code: string) => void
  removeVoucher: () => void
  appliedVoucherCode: string | null
  useBHC: boolean
  setUseBHC: (value: boolean) => void
  customerWallet: { wallet: { promoBalance: number } } | null
  isInsufficientFunds?: boolean
}

export function OrderSummaryCard({
  cart,
  total,
  serviceFee,
  finalTotal,
  loading,
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
  useBHC,
  setUseBHC,
  customerWallet,
  isInsufficientFunds,
}: OrderSummaryCardProps) {
  const router = useRouter()

  const promoBalance = customerWallet?.wallet?.promoBalance ?? 0
  const discountedTotal =
    useBHC && promoBalance > 0
      ? Math.max(0, finalTotal - Math.min(promoBalance, finalTotal))
      : finalTotal

  return (
    <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 font-heading text-xl font-semibold">Order Summary</h2>

      <div className="mb-6 space-y-4">
        {cart.items.map((ci) => (
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
            <span className="font-bold">
              {formatPrice(ci.menuItem.price * ci.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-3 border-t border-border pt-6 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Items Subtotal</span>
          <span>{formatPriceExact(total)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery Fee</span>
          <span>
            {noZonesAvailable ? (
              <span className="text-xs text-primary">
                {isCrossCampus ? "Wrong campus" : "Not configured"}
              </span>
            ) : isValidLocation ? (
              cart.vendorDeliveryFee === 0 ? (
                "Free"
              ) : (
                formatPriceExact(cart.vendorDeliveryFee)
              )
            ) : (
              "Select location"
            )}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Service Fee</span>
          <span>{formatPriceExact(serviceFee)}</span>
        </div>
        {useBHC && promoBalance > 0 && (
          <div className="flex justify-between font-medium text-primary">
            <span>BiteHub Coins Applied</span>
            <span>-{formatPriceExact(Math.min(promoBalance, finalTotal))}</span>
          </div>
        )}
      </div>

      <AvailableRewards
        cart={cart as never}
        customerWallet={customerWallet}
        applyVoucher={applyVoucher}
        removeVoucher={removeVoucher}
        appliedVoucherCode={appliedVoucherCode}
        useBHC={useBHC}
        setUseBHC={setUseBHC}
        finalTotalWithoutBHC={finalTotal}
      />

      <div className="mb-6 flex justify-between border-t border-border pt-6 font-heading text-xl font-bold">
        <span>Total</span>
        <span className="text-primary">
          {formatPriceExact(discountedTotal)}
        </span>
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
            isSyncing ||
            cart.items.length === 0 ||
            !isValidLocation ||
            noZonesAvailable
          }
        >
          {loading || isSyncing ? (
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
