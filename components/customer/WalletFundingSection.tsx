"use client"

import { useState } from "react"
import Image from "next/image"
import { Wallet as WalletIcon, Landmark, Banknote } from "lucide-react"
import { formatPriceExact } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { ActivateWalletForm } from "@/components/customer/ActivateWalletForm"
import {
  FundWalletFlow,
  type FundWalletFlowWalletInfo,
} from "@/components/customer/FundWalletFlow"
import { StellarDepositTab } from "@/components/customer/StellarDepositTab"

interface WalletFundingSectionProps {
  walletBalance: number
  depositBalance: number
  promoBalance: number
  hasWallet: boolean
  isActive: boolean
  wallet: FundWalletFlowWalletInfo | null
}

export function WalletFundingSection({
  walletBalance,
  depositBalance,
  promoBalance,
  hasWallet,
  isActive,
  wallet,
}: WalletFundingSectionProps) {
  const [fundingMode, setFundingMode] = useState<"bank" | "crypto">("bank")
  const isStellarEnabled =
    process.env.NEXT_PUBLIC_ENABLE_STELLAR_DEMO === "true"

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      {/* Left Card: Balance & Funding Mode Action */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <WalletIcon className="size-5 text-primary" />
            </div>
            <p className="font-semibold text-muted-foreground">
              Available Balance
            </p>
          </div>
          <h2 className="text-4xl font-bold tracking-tight">
            {formatPriceExact(walletBalance)}
          </h2>
          {hasWallet && (
            <div className="mt-4 space-y-1.5 rounded-lg bg-muted/40 px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Deposited</span>
                <span className="font-semibold">
                  {formatPriceExact(depositBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  BiteHub Coins (BHC)
                </span>
                <span className="font-semibold text-primary">
                  {formatPriceExact(promoBalance)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-3 border-t border-border pt-6">
          {!isActive && <ActivateWalletForm />}

          {!isStellarEnabled ? (
            isActive && (
              <Button
                variant="outline"
                className="w-full justify-start pl-4"
                disabled
              >
                <Banknote className="mr-3 size-4" /> Fund via Crypto (Coming
                Soon)
              </Button>
            )
          ) : fundingMode === "bank" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setFundingMode("crypto")}
              className="w-full justify-start border-primary/30 bg-primary/5 pl-4 font-semibold text-foreground hover:border-primary hover:bg-primary/10"
            >
              <Image
                src="/stellar-logo.png"
                alt="Stellar"
                width={18}
                height={18}
                className="mr-3 rounded-full"
              />
              Fund via Crypto (USDC)
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setFundingMode("bank")}
              className="w-full justify-start border-border bg-background pl-4 font-semibold text-foreground"
            >
              <Landmark className="mr-3 size-4 text-primary" />
              Fund via Bank Transfer
            </Button>
          )}
        </div>
      </div>

      {/* Right Card: Switches cleanly between Bank Transfer and Stellar USDC */}
      <div className="lg:col-span-2">
        {fundingMode === "crypto" && isStellarEnabled ? (
          <StellarDepositTab onBack={() => setFundingMode("bank")} />
        ) : !isActive ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
              <Landmark className="size-5 text-primary" /> Virtual Bank Account
            </h3>
            <div className="flex h-40 flex-col items-center justify-center space-y-3 text-center">
              <div className="rounded-full border border-border bg-background p-3">
                <Landmark className="size-6 text-muted-foreground" />
              </div>
              <p className="max-w-[250px] text-sm font-medium text-muted-foreground">
                Activate your wallet to get a dedicated Monnify account number
                for automatic funding.
              </p>
            </div>
          </div>
        ) : (
          wallet && <FundWalletFlow wallet={wallet} />
        )}
      </div>
    </div>
  )
}
