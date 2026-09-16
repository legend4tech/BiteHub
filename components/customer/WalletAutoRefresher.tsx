"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function WalletAutoRefresher() {
  const router = useRouter()
  const hasToastedRef = useRef(false)

  useEffect(() => {
    let eventSource: EventSource | null = null
    let retryTimeout: NodeJS.Timeout

    const connect = () => {
      eventSource = new EventSource("/api/customer/wallet/stream")

      eventSource.onmessage = (event) => {
        if (event.data === "update") {
          // Play a nice success toast but ensure we don't spam if multiple events fire somehow
          if (!hasToastedRef.current) {
            hasToastedRef.current = true
            toast.success("Wallet credited successfully!", {
              description:
                "Your balance and transaction history have been updated in real-time.",
              duration: 6000,
            })
            // Reset after a few seconds so future transfers work too
            setTimeout(() => {
              hasToastedRef.current = false
            }, 10000)
          }

          // Instantly pull the new Server Component data
          router.refresh()
        }
      }

      eventSource.onerror = () => {
        // Silently retry on disconnect
        eventSource?.close()
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      clearTimeout(retryTimeout)
      eventSource?.close()
    }
  }, [router])

  return null // Invisible component
}
