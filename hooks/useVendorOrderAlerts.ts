"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { useVendorOrders } from "@/hooks/queries/useVendorOrders"
import { toast } from "sonner"

// Auto-unlock helper to satisfy strict browser autoplay policies
let globalAudioContext: AudioContext | null = null

function getUnlockedAudioContext(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioContextClass) return null

    if (!globalAudioContext) {
      globalAudioContext = new AudioContextClass()
    }

    if (globalAudioContext.state === "suspended") {
      globalAudioContext.resume()
    }

    return globalAudioContext
  } catch (e) {
    console.error("Failed to initialize AudioContext:", e)
    return null
  }
}

// Synthesize a beautiful high-fidelity "Ding-Dong" notification chime
export function playNotificationSound() {
  try {
    const ctx = getUnlockedAudioContext()
    if (!ctx) return

    // First Tone: G5
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime) // G5
    gain1.gain.setValueAtTime(0, ctx.currentTime)
    gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.35)

    // Second Tone: C6 (slight delay for a pleasant musical chord chime)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1) // C6
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1)
    gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc2.start(ctx.currentTime + 0.1)
    osc2.stop(ctx.currentTime + 0.5)
  } catch (error) {
    console.error("Failed to play synthesized notification chime:", error)
  }
}

// Expose testing function globally to make developer testing 100% painless in DevTools console
if (typeof window !== "undefined") {
  ;(window as Window & { testChime?: () => void }).testChime =
    playNotificationSound

  // Unlock on first interaction
  const unlock = () => {
    getUnlockedAudioContext()
    window.removeEventListener("click", unlock)
    window.removeEventListener("touchstart", unlock)
  }
  window.addEventListener("click", unlock)
  window.addEventListener("touchstart", unlock)
}

// Trigger browser native system notification
function triggerBrowserNotification(
  orderId: string,
  customerName: string,
  location: string
) {
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      const notification = new Notification("New Order on BiteHub! 🍔", {
        body: `Order ${orderId} received from ${customerName} at ${location}.`,
        icon: "/brand_logo.png",
        tag: orderId,
        requireInteraction: true,
      })

      notification.onclick = () => {
        window.focus()
        window.location.href = "/vendor/orders"
      }
    } catch (err) {
      console.error("Browser notification failed:", err)
    }
  }
}

export function useVendorOrderAlerts() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const isVendor = session?.user?.role === "vendor" && !!session?.user?.vendorId

  // Track known pending order IDs to prevent false alerts on initial load
  const knownOrderIds = useRef<Set<string>>(new Set())
  const isInitialLoad = useRef(true)

  // Poll confirmed orders in the background every 15 seconds
  const { data: pendingOrders } = useVendorOrders({
    status: "confirmed",
    enabled: isVendor,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    staleTime: 0, // ensure fresh server checks on every poll
  })

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [])

  useEffect(() => {
    if (!pendingOrders) return

    const currentOrderIds = pendingOrders.map((o) => o.orderId)

    if (isInitialLoad.current) {
      // First load: just populate our known cache, do not trigger alerts
      currentOrderIds.forEach((id) => knownOrderIds.current.add(id))
      isInitialLoad.current = false
      return
    }

    // Find new order IDs that we haven't seen yet
    const newOrders = pendingOrders.filter(
      (o) => !knownOrderIds.current.has(o.orderId)
    )

    if (newOrders.length > 0) {
      // Play dynamic sound chime
      playNotificationSound()

      newOrders.forEach((order) => {
        // Add to known cache
        knownOrderIds.current.add(order.orderId)

        // Show Sonner toast inside the app
        toast.success(
          `🔔 New Order! ${order.orderId} from ${order.customerName} (Total: ₦${order.totalAmount})`,
          {
            duration: 10000,
            action: {
              label: "View Orders",
              onClick: () => {
                window.location.href = "/vendor/orders"
              },
            },
          }
        )

        // Trigger system notification
        triggerBrowserNotification(
          order.orderId,
          order.customerName,
          order.location
        )
      })

      // Force-refresh all other dashboard components, charts, and lists
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] })
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    }

    // Keep the cache clean: remove any order IDs that are no longer pending
    const currentSet = new Set(currentOrderIds)
    knownOrderIds.current.forEach((id) => {
      if (!currentSet.has(id)) {
        knownOrderIds.current.delete(id)
      }
    })
  }, [pendingOrders, queryClient])
}
