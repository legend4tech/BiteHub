"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import {
  Copy,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Zap,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Share2,
  Clock,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPriceExact } from "@/lib/format"
import { nairaToKobo } from "@/lib/money"
import { toast } from "sonner"
import type { StellarDepositSession } from "@/lib/stellar/stellarTestnet"

const QUICK_AMOUNTS = [1000, 3500, 5000, 10000, 25000]
const FALLBACK_RATE = 1600

interface StellarDepositTabProps {
  onBack?: () => void
}

export function StellarDepositTab({ onBack }: StellarDepositTabProps) {
  const [amountStr, setAmountStr] = useState("5000")
  const [exchangeRate, setExchangeRate] = useState<number>(FALLBACK_RATE)
  const [session, setSession] = useState<StellarDepositSession | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(300)
  const [confirmation, setConfirmation] = useState<{
    confirmed: boolean
    hash?: string
    explorerUrl?: string
  } | null>(null)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const desiredNaira = Number(amountStr) || 0
  const desiredKobo = nairaToKobo(desiredNaira)
  const estimatedUSDC = (desiredNaira / exchangeRate).toFixed(2)
  const currentStep = confirmation?.confirmed ? 3 : session ? 2 : 1

  useEffect(() => {
    fetch("/api/stellar/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && typeof d.rate === "number") setExchangeRate(d.rate)
      })
      .catch(() => {})
  }, [])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const handleCopySponsorMessage = () => {
    if (!session) return
    const msg =
      `Hey! Please help fund my BiteHub campus meal wallet (${formatPriceExact(nairaToKobo(session.amountInNaira))}):\n\n` +
      `• Network: Stellar (USDC)\n• Amount: ${session.amountInUSDC} USDC\n` +
      `• Address: ${session.destinationAddress}\n• REQUIRED MEMO: ${session.memo}\n\n` +
      `(Include the 6-digit memo so BiteHub credits my student account automatically!)`
    navigator.clipboard.writeText(msg)
    toast.success("Sponsor WhatsApp message copied!")
  }

  const generateDepositSession = async () => {
    if (desiredNaira < 500) {
      toast.error("Minimum crypto deposit is ₦500 (~0.31 USDC)")
      return
    }
    try {
      setIsGenerating(true)
      setConfirmation(null)
      const res = await fetch("/api/stellar/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountInNaira: desiredNaira }),
      })
      const data = await res.json()
      if (data.success && data.session) {
        setSession(data.session)
        setSecondsLeft(300)
        toast.success("Transfer details & payment memo ready!")
      } else {
        toast.error(data.message || "Failed to prepare transfer details")
      }
    } catch {
      toast.error("Network error preparing transfer details")
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (!session || confirmation?.confirmed) return
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [session, confirmation])

  useEffect(() => {
    if (!session || confirmation?.confirmed) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }
    const checkVerification = async () => {
      try {
        const res = await fetch(`/api/stellar/verify?memo=${session.memo}`)
        const data = await res.json()
        if (data.success && data.confirmed) {
          setConfirmation({
            confirmed: true,
            hash: data.hash,
            explorerUrl: data.explorerUrl,
          })
          toast.success("Stellar USDC payment verified on-chain!")
        }
      } catch {
        // Ignore transient polling errors
      }
    }
    pollingRef.current = setInterval(checkVerification, 4000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [session, confirmation])

  const handleSimulatePayment = async () => {
    if (!session) return
    try {
      setIsSimulating(true)
      toast.info("Broadcasting USDC transfer on Stellar Testnet...")
      const res = await fetch("/api/stellar/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationAddress: session.destinationAddress,
          memo: session.memo,
          amount: session.amountInUSDC,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setConfirmation({
          confirmed: true,
          hash: data.hash,
          explorerUrl: data.explorerUrl,
        })
        toast.success("On-chain transfer confirmed on Stellar Testnet!")
      } else {
        toast.error(data.message || "Simulation failed")
      }
    } catch {
      toast.error("Failed to execute testnet simulation")
    } finally {
      setIsSimulating(false)
    }
  }

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
      {/* Top Navigation & 3-Step Progress Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
        {session && !confirmation?.confirmed ? (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSession(null)
              setConfirmation(null)
            }}
          >
            <ArrowLeft className="mr-1.5 size-3.5" /> Change Amount
          </Button>
        ) : onBack ? (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="mr-1.5 size-3.5" /> Back to Bank Transfer
          </Button>
        ) : (
          <span className="text-xs font-semibold text-primary">
            Stellar Testnet Rail
          </span>
        )}

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={`rounded-full px-2.5 py-0.5 ${currentStep === 1 ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"}`}
          >
            1. Amount
          </span>
          <span className="text-muted-foreground">→</span>
          <span
            className={`rounded-full px-2.5 py-0.5 ${currentStep === 2 ? "bg-primary text-primary-foreground" : currentStep > 2 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            2. Scan & Memo
          </span>
          <span className="text-muted-foreground">→</span>
          <span
            className={`rounded-full px-2.5 py-0.5 ${currentStep === 3 ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
          >
            3. Verified
          </span>
        </div>
      </div>

      {/* STEP 1: AMOUNT & FEE CALCULATOR */}
      {currentStep === 1 && (
        <div className="animate-in space-y-4 duration-300 fade-in slide-in-from-right-4">
          <div>
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
              <Image
                src="/stellar-logo.png"
                alt="Stellar"
                width={22}
                height={22}
                className="rounded-full"
              />
              Fund via Stellar USDC
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the amount you want credited to your wallet. Send USDC from
              any Stellar wallet or exchange using BiteHub&apos;s deposit
              address and the payment memo on the next step.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Desired Meal Wallet Credit
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
                placeholder="5000"
                min="500"
                max="500000"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountStr(amt.toString())}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${Number(amountStr) === amt ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-background p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount to credit</span>
              <span className="font-semibold">
                {formatPriceExact(desiredKobo)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Live Exchange Rate</span>
              <span className="font-medium text-foreground">
                1 USDC = ₦{exchangeRate.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing Fee</span>
              <span className="font-semibold text-success">₦0.00 (Free)</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="font-bold text-foreground">
                Total USDC to Send
              </span>
              <span className="text-lg font-bold text-primary">
                ~{estimatedUSDC} USDC
              </span>
            </div>
          </div>

          <Button
            className="h-12 w-full font-bold"
            onClick={generateDepositSession}
            disabled={isGenerating || desiredNaira < 500}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Preparing
                Transfer Details...
              </>
            ) : (
              <>
                Continue to Transfer <ArrowRight className="ml-2 size-5" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* STEP 2: QR CODE, MEMO & SIMULATOR */}
      {currentStep === 2 && session && (
        <div className="animate-in space-y-5 duration-300 fade-in slide-in-from-right-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
            <div>
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                Awaiting On-Chain Deposit
              </p>
              <p className="text-sm font-bold text-foreground">
                Send{" "}
                <span className="text-primary">
                  {session.amountInUSDC} USDC
                </span>{" "}
                for {formatPriceExact(nairaToKobo(session.amountInNaira))}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (secondsLeft === 0) {
                  setSecondsLeft(300)
                  toast.success("Rate quote refreshed for 5 minutes!")
                }
              }}
              className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
            >
              <Clock className="size-3.5 text-primary" />
              <span>
                {secondsLeft > 0
                  ? `Rate locked: ${formatTimer(secondsLeft)}`
                  : "Quote expired • Tap to refresh"}
              </span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-5">
            <div className="flex flex-col items-center justify-between rounded-xl border border-border bg-background p-4 sm:col-span-2">
              <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                <QRCodeSVG
                  value={session.qrUri}
                  size={148}
                  level="H"
                  imageSettings={{
                    src: "/stellar-logo.png",
                    height: 30,
                    width: 30,
                    excavate: true,
                  }}
                />
              </div>
              <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
                Scan with Lobstr, Freighter, or any Stellar USDC wallet
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full text-xs font-semibold"
                onClick={handleCopySponsorMessage}
              >
                <Share2 className="mr-1.5 size-3.5 text-primary" /> Copy for
                Sponsor
              </Button>
            </div>

            <div className="flex flex-col justify-between space-y-3 sm:col-span-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Exact Amount (Stellar USDC)
                  </p>
                  <p className="text-base font-bold text-primary">
                    {session.amountInUSDC} USDC
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleCopy(session.amountInUSDC, "USDC Amount")
                  }
                >
                  <Copy className="size-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    BiteHub Deposit Address
                  </p>
                  <p className="truncate font-mono text-xs font-semibold text-foreground">
                    {session.destinationAddress}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleCopy(session.destinationAddress, "Deposit Address")
                  }
                >
                  <Copy className="size-4" />
                </Button>
              </div>

              <div className="rounded-xl border border-primary/30 bg-background p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Payment Memo
                      </p>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary uppercase">
                        Required
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-xl font-bold tracking-widest text-primary">
                      {session.memo}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(session.memo, "Memo")}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Include this 6-digit memo when sending so BiteHub credits your
                  wallet automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <RefreshCw className="size-3.5 animate-spin text-primary" />
              <span>
                Waiting for your transfer with Memo{" "}
                <strong className="text-foreground">#{session.memo}</strong>...
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-primary/30 bg-primary/10 font-bold text-primary hover:bg-primary/20"
              onClick={handleSimulatePayment}
              disabled={isSimulating}
            >
              {isSimulating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Broadcasting
                  on Stellar Testnet...
                </>
              ) : (
                <>
                  <Zap className="mr-2 size-4 fill-primary" /> Simulate Testnet
                  Transfer ({session.amountInUSDC} USDC)
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: ON-CHAIN VERIFIED RECEIPT */}
      {currentStep === 3 && session && confirmation && (
        <div className="animate-in space-y-5 duration-300 zoom-in-95 fade-in">
          <div className="rounded-2xl border border-success/30 bg-success/10 p-6 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success/20 text-success">
              <CheckCircle2 className="size-7" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground">
              On-Chain Payment Verified!
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Your incoming USDC transfer was confirmed on the Stellar network
              in under 5 seconds.
            </p>
          </div>

          <div className="space-y-2.5 rounded-xl border border-border bg-background p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Estimated Wallet Credit
              </span>
              <span className="font-bold text-success">
                +{formatPriceExact(nairaToKobo(session.amountInNaira))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                On-Chain Amount Received
              </span>
              <span className="font-semibold text-foreground">
                {session.amountInUSDC} USDC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Matched Memo</span>
              <span className="font-mono font-bold text-primary">
                #{session.memo}
              </span>
            </div>
            {confirmation.hash && (
              <div className="flex items-center justify-between border-t border-border pt-2.5">
                <span className="text-muted-foreground">Transaction Hash</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(confirmation.hash!, "Transaction Hash")
                  }
                  className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground hover:text-primary"
                >
                  {confirmation.hash.slice(0, 8)}...
                  {confirmation.hash.slice(-8)} <Copy className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-background/70 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <strong>Testnet Preview:</strong> Your USDC transfer was verified
              on the Stellar blockchain! Because this preview uses Stellar
              Testnet tokens (free test funds), your real Naira meal balance is
              not credited yet.
            </span>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            {confirmation.explorerUrl && (
              <Button asChild className="h-11 flex-1 font-bold">
                <a
                  href={confirmation.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Stellar Expert{" "}
                  <ExternalLink className="ml-2 size-4" />
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              className="h-11 font-semibold"
              onClick={() => {
                setSession(null)
                setConfirmation(null)
              }}
            >
              New Crypto Deposit
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
