"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { playWalletFundedSound } from "@/lib/audio"

export function WalletAutoRefresher() {
  const router = useRouter()
  const hasToastedRef = useRef(false)
  const lastBalanceRef = useRef<number | null>(null)

  const triggerCelebration = useCallback(() => {
    playWalletFundedSound()

    if (!hasToastedRef.current) {
      hasToastedRef.current = true
      toast.success("Wallet credited successfully!", {
        description:
          "Your balance and transaction history have been updated in real-time.",
        duration: 6000,
      })
      setTimeout(() => {
        hasToastedRef.current = false
      }, 8000)
    }

    router.refresh()
  }, [router])

  const checkBalanceUpdate = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/wallet", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const currentBalance = data.wallet?.balanceInKobo

      if (typeof currentBalance === "number") {
        if (
          lastBalanceRef.current !== null &&
          currentBalance > lastBalanceRef.current
        ) {
          lastBalanceRef.current = currentBalance
          triggerCelebration()
        } else {
          lastBalanceRef.current = currentBalance
        }
      }
    } catch {
      // Ignored if offline
    }
  }, [triggerCelebration])

  useEffect(() => {
    // Snapshot initial balance on mount
    checkBalanceUpdate()

    let eventSource: EventSource | null = null
    let retryTimeout: NodeJS.Timeout

    const connect = () => {
      try {
        eventSource = new EventSource("/api/customer/wallet/stream")

        eventSource.onmessage = (event) => {
          if (event.data === "update") {
            triggerCelebration()
            // Sync local balance snapshot
            checkBalanceUpdate()
          }
        }

        eventSource.onerror = () => {
          eventSource?.close()
          eventSource = null
          retryTimeout = setTimeout(connect, 3000)
        }
      } catch {
        // Fallback retry
        retryTimeout = setTimeout(connect, 4000)
      }
    }

    connect()

    // Mobile background recovery: user switches to bank app, then returns
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkBalanceUpdate()
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          connect()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityOrFocus)
    window.addEventListener("focus", handleVisibilityOrFocus)

    return () => {
      clearTimeout(retryTimeout)
      eventSource?.close()
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus)
      window.removeEventListener("focus", handleVisibilityOrFocus)
    }
  }, [checkBalanceUpdate, triggerCelebration])

  return null // Invisible component
}
