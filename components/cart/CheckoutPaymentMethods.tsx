import { Controller, type Control } from "react-hook-form"
import { Wallet, Lock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPriceExact } from "@/lib/format"
import type { OrderFormInputValues } from "@/lib/schemas"

interface CustomerWalletData {
  wallet?: {
    balance: number
    depositBalance: number
  }
}

interface CheckoutPaymentMethodsProps {
  control: Control<OrderFormInputValues>
  isCustomer: boolean
  isWalletLoading: boolean
  customerWallet: CustomerWalletData | null | undefined
  targetAmountToReceive: number
  serviceFee: number
  router: { push: (url: string) => void }
  isRewardApplied: boolean
}

export function CheckoutPaymentMethods({
  control,
  isCustomer,
  isWalletLoading,
  customerWallet,
  targetAmountToReceive,
  serviceFee,
  router,
  isRewardApplied,
}: CheckoutPaymentMethodsProps) {
  return (
    <Controller
      name="paymentMethod"
      control={control}
      render={({ field }) => (
        <div
          className={`grid gap-4 ${isCustomer ? "md:grid-cols-2" : "grid-cols-1"}`}
        >
          <button
            type="button"
            onClick={() => {
              if (!isRewardApplied) field.onChange("monnify")
            }}
            disabled={isRewardApplied}
            className={`flex flex-col items-center justify-center rounded-xl border p-6 transition-all ${
              field.value === "monnify"
                ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                : isRewardApplied
                  ? "cursor-not-allowed border-border bg-muted/20 opacity-50"
                  : "border-border hover:bg-muted"
            }`}
          >
            <div className="mb-2 flex h-8 items-center rounded border border-border bg-white px-2 shadow-sm">
              <span className="font-bold text-primary">monnify</span>
            </div>
            <span className="font-bold">Pay with Monnify</span>
            {isRewardApplied ? (
              <span className="mt-1 text-center text-[11px] leading-tight font-medium text-destructive">
                <Lock className="mr-0.5 mb-[2px] inline-block size-3" /> Locked.
                Remove rewards <br /> to use Monnify.
              </span>
            ) : (
              <span className="mt-1 text-center text-sm text-muted-foreground">
                {field.value === "monnify"
                  ? `(+${formatPriceExact(serviceFee)} fee)`
                  : "Secure, automated"}
              </span>
            )}
          </button>
          {isCustomer && (
            <button
              type="button"
              onClick={() => {
                if (
                  isWalletLoading ||
                  !customerWallet?.wallet ||
                  customerWallet.wallet.depositBalance < targetAmountToReceive
                )
                  return
                field.onChange("wallet")
              }}
              className={`flex flex-col items-center justify-center rounded-xl border p-6 transition-all ${
                field.value === "wallet"
                  ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                  : isWalletLoading
                    ? "cursor-not-allowed border-border bg-muted/10"
                    : !customerWallet?.wallet ||
                        customerWallet.wallet.depositBalance <
                          targetAmountToReceive
                      ? "cursor-not-allowed border-border bg-muted/30 opacity-80"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold">BiteHub Wallet</span>

              {isWalletLoading ? (
                <div className="mt-2 flex w-full flex-col items-center gap-1.5 px-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ) : !customerWallet?.wallet ? (
                <div className="mt-2 flex flex-col items-center">
                  <span className="mb-2 text-xs text-muted-foreground">
                    Not Activated
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push("/customer/wallet")
                    }}
                    className="inline-flex h-6 cursor-pointer items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Activate
                  </span>
                </div>
              ) : (
                <div className="mt-1 flex flex-col items-center text-sm text-muted-foreground">
                  <span>
                    Bal:{" "}
                    {formatPriceExact(customerWallet.wallet.depositBalance)}
                  </span>
                  {customerWallet.wallet.depositBalance <
                  targetAmountToReceive ? (
                    <div className="mt-1 flex flex-col items-center">
                      <span className="mb-2 text-center text-[10px] leading-tight font-medium text-destructive">
                        Insufficient funds <br /> for this order
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push("/customer/wallet")
                        }}
                        className="inline-flex h-6 cursor-pointer items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Top up
                      </span>
                    </div>
                  ) : (
                    <span className="mt-1 text-xs">
                      {field.value === "wallet"
                        ? "No extra fee"
                        : "Instant Checkout"}
                    </span>
                  )}
                </div>
              )}
            </button>
          )}
        </div>
      )}
    />
  )
}
