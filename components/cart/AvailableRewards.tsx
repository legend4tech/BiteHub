"use client"

import { useCustomerVouchers } from "@/hooks/customer/useCustomerVouchers"
import { Button } from "@/components/ui/button"
import { Ticket, Coins } from "lucide-react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"
import { toMajorUnit } from "@/lib/money"

interface AvailableRewardsProps {
  cart: {
    items: Array<{
      menuItem: { id: string; name: string; priceInKobo: number }
    }>
    vendorId: string | null
  }
  customerWallet?: {
    wallet: {
      promoBalanceInKobo: number
    }
  } | null
  applyVoucher: (code: string, menuItemId: string) => void
  removeVoucher: () => void
  appliedVoucherCode: string | null
  useBHC: boolean
  setUseBHC: (value: boolean) => void
  finalTotalWithoutBHC: number
}

export function AvailableRewards({
  cart,
  customerWallet,
  applyVoucher,
  removeVoucher,
  appliedVoucherCode,
  useBHC,
  setUseBHC,
  finalTotalWithoutBHC,
}: AvailableRewardsProps) {
  const { data: vouchers, isLoading } = useCustomerVouchers()

  const promoBalance = customerWallet?.wallet?.promoBalanceInKobo || 0
  const hasBHC = promoBalance > 0

  // Calculate how much they will actually save
  const potentialSavings = Math.min(promoBalance, finalTotalWithoutBHC)

  const unusedVouchers =
    vouchers?.filter((v: { isUsed: boolean }) => !v.isUsed) || []

  if (!hasBHC && unusedVouchers.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      {/* BiteHub Coins Toggle */}
      {hasBHC && (
        <div
          className={`flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm transition-opacity ${finalTotalWithoutBHC <= 0 ? "opacity-50 grayscale" : ""}`}
        >
          <div>
            <div className="flex items-center gap-2">
              <Coins className="size-5 text-yellow-500" />
              <p className="font-medium text-foreground">BiteHub Coins</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              You have{" "}
              <span className="font-bold text-primary">
                {toMajorUnit(promoBalance)} BHC
              </span>{" "}
              available.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Switch
              disabled={finalTotalWithoutBHC <= 0}
              checked={useBHC && finalTotalWithoutBHC > 0}
              onCheckedChange={(checked) => {
                setUseBHC(checked)
                if (checked) {
                  toast.success(
                    `Applying ${formatPrice(potentialSavings)} discount!`
                  )
                }
              }}
            />
            {useBHC && (
              <span className="text-[10px] font-bold text-primary">
                -{formatPrice(potentialSavings)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Vouchers List */}
      {isLoading ? (
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      ) : unusedVouchers.length > 0 ? (
        <div className="space-y-2">
          {unusedVouchers.map(
            (voucher: {
              id: string
              code: string
              vendorId: string
              menuItemId: string
              menuItem?: { name: string }
              expiresAt: string
            }) => {
              const isApplied = appliedVoucherCode === voucher.code

              // Wait, voucher API returns menuItem.id? Let's assume it does. Or we match by name.
              // Let's match by vendorId first to see if it's even for this vendor.
              const isSameVendor = voucher.vendorId === cart.vendorId

              // To be perfectly safe, if it's the same vendor, we allow them to apply it.
              // If they apply it but the meal isn't in the cart, the backend will reject it later.
              // But we can check if the meal name exists in the cart.
              const mealInCart = cart.items.some(
                (i) => i.menuItem.name === voucher.menuItem?.name
              )

              const isApplicable = isSameVendor && mealInCart

              return (
                <div
                  key={voucher.id}
                  className={`flex flex-col gap-2 rounded-lg border p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${isApplied ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Ticket className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {voucher.menuItem?.name || "Free Meal"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Code: <span className="font-mono">{voucher.code}</span>
                        {" • "}
                        Expires:{" "}
                        <span className="font-medium text-foreground">
                          {new Date(voucher.expiresAt).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isApplied ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full border-destructive text-destructive hover:bg-destructive/10 sm:w-auto"
                        onClick={() => {
                          removeVoucher()
                          toast.info("Voucher removed")
                        }}
                      >
                        Remove
                      </Button>
                    ) : isApplicable ? (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          applyVoucher(voucher.code, voucher.menuItemId)
                          toast.success("Voucher applied!")
                        }}
                      >
                        Apply
                      </Button>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full text-xs sm:w-auto"
                      >
                        <Link href={`/menu/${voucher.menuItemId}`}>
                          Pick Meal &rarr;
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            }
          )}
        </div>
      ) : null}
    </div>
  )
}
