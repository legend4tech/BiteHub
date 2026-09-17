"use client"

import { useState } from "react"
import {
  Copy,
  Landmark,
  ArrowRight,
  ArrowLeft,
  Info,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPriceExact } from "@/lib/format"
import { computeMonnifyServiceFee } from "@/lib/fees"
import { toast } from "sonner"

const QUICK_AMOUNTS = [100, 500, 1000, 3500, 5000, 10000]

export interface FundWalletFlowWalletInfo {
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
}

export function FundWalletFlow({
  wallet,
}: {
  wallet: FundWalletFlowWalletInfo
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [amountStr, setAmountStr] = useState("1000")

  const desiredAmount = Number(amountStr) || 0
  const calculatedFee = computeMonnifyServiceFee(desiredAmount)
  const totalToTransfer = desiredAmount + calculatedFee

  const handleCopy = (text: string | null, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
      <div className="relative overflow-hidden">
        {step === 1 ? (
          <div className="animate-in duration-300 fade-in slide-in-from-left-4">
            <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
              <Landmark className="size-5 text-primary" /> Fund Wallet
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Enter the exact amount you want to be credited to your wallet. We
              will calculate the required transfer amount to cover processing
              fees.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Desired Wallet Credit
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    type="number"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="h-12 border-border bg-background pl-8 text-lg font-bold shadow-sm focus-visible:ring-primary"
                    placeholder="0.00"
                    min="100"
                    max="100000"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountStr(amt.toString())}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Amount to credit
                  </span>
                  <span className="font-semibold">
                    {formatPriceExact(desiredAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Processing Fee (Monnify)
                  </span>
                  <span className="font-semibold text-destructive">
                    {formatPriceExact(calculatedFee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="font-bold text-foreground">
                    Total to Transfer
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatPriceExact(totalToTransfer)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-warning-foreground">
                <Info className="mt-0.5 size-5 shrink-0 text-warning" />
                <div className="text-xs leading-relaxed">
                  <p className="mb-1 font-semibold">Transfer Limits</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    <li>Minimum single deposit: ₦100</li>
                    <li>Maximum single deposit: ₦100,000</li>
                    <li>Maximum daily deposit: ₦500,000</li>
                  </ul>
                </div>
              </div>

              <Button
                className="text-md h-12 w-full font-bold"
                onClick={() => {
                  if (desiredAmount < 100) {
                    toast.error("Minimum funding amount is ₦100")
                    return
                  }
                  if (totalToTransfer > 100000) {
                    toast.error("Maximum single transfer limit is ₦100,000")
                    return
                  }
                  setStep(2)
                }}
              >
                Continue to Transfer <ArrowRight className="ml-2 size-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-in duration-300 fade-in slide-in-from-right-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-3 text-muted-foreground hover:text-foreground"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="mr-2 size-4" /> Back to calculator
            </Button>

            <div className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
                <p className="mb-1 text-sm font-semibold tracking-wider text-primary uppercase">
                  Action Required
                </p>
                <h2 className="text-2xl font-bold text-foreground">
                  Transfer exactly{" "}
                  <span className="text-primary">
                    {formatPriceExact(totalToTransfer)}
                  </span>
                </h2>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Bank Name
                  </p>
                  <p className="font-bold">{wallet.bankName}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                      Account Number
                    </p>
                    <p className="font-mono text-lg font-bold tracking-wider text-primary">
                      {wallet.accountNumber}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      handleCopy(wallet.accountNumber, "Account Number")
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Account Name
                  </p>
                  <p className="font-bold">{wallet.accountName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-muted bg-muted/50 p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Transfers reflect almost instantly. To cover Monnify&apos;s
                  processing charges, we auto-deduct the{" "}
                  {formatPriceExact(calculatedFee)} fee and credit your wallet
                  with exactly {formatPriceExact(desiredAmount)}.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
