"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { RotateCw, ArrowDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PullToRefreshContainerProps {
  children: React.ReactNode
  threshold?: number
  maxPull?: number
}

function playHapticFeedback() {
  // 1. Physical vibration for supported Android devices
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(12)
    } catch {
      // Ignored if vibration is restricted
    }
  }

  // 2. Synthesized acoustic tactile tick (works on iOS Safari, Android, and Desktop)
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(140, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.02)

    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.02)
  } catch {
    // Ignored if AudioContext is blocked before user interaction
  }
}

export function PullToRefreshContainer({
  children,
  threshold = 70,
  maxPull = 120,
}: PullToRefreshContainerProps) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const [pullDistance, setPullDistance] = useState(0)
  const [status, setStatus] = useState<
    "idle" | "pulling" | "can-release" | "refreshing" | "completed"
  >("idle")
  const [isDragging, setIsDragging] = useState(false)
  // Keeps the transform alive until the spring-back finishes, then drops it entirely
  const [isSettling, setIsSettling] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const startXRef = useRef(0)
  const isPullingRef = useRef(false)
  const hasTriggeredHapticRef = useRef(false)
  const statusRef = useRef(status)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  // A transformed ancestor offsets sticky headers (navbar) and re-parents fixed elements, so
  // if the user scrolls while the refresh offset is held open, collapse it immediately.
  useEffect(() => {
    if (status !== "refreshing" && status !== "completed") return
    const onScroll = () => {
      if ((window.scrollY || document.documentElement.scrollTop || 0) > 1) {
        setPullDistance(0)
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [status])

  // Fallback in case transitionend never fires (e.g. interrupted transition)
  useEffect(() => {
    if (pullDistance !== 0 || !isSettling || isDragging) return
    const timer = setTimeout(() => setIsSettling(false), 500)
    return () => clearTimeout(timer)
  }, [pullDistance, isSettling, isDragging])

  const handleStart = useCallback(
    (clientY: number, clientX: number, target: HTMLElement | null) => {
      if (
        statusRef.current === "refreshing" ||
        statusRef.current === "completed"
      ) {
        return
      }

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0
      if (scrollY > 1) return

      if (
        target &&
        target.closest(
          "input, textarea, select, [role='dialog'], [data-no-ptr]"
        )
      ) {
        return
      }

      startYRef.current = clientY
      startXRef.current = clientX
      isPullingRef.current = true
      hasTriggeredHapticRef.current = false
    },
    []
  )

  const handleMove = useCallback(
    (
      clientY: number,
      clientX: number,
      cancelable: boolean,
      preventDefault: () => void
    ) => {
      if (!isPullingRef.current) return
      if (
        statusRef.current === "refreshing" ||
        statusRef.current === "completed"
      ) {
        return
      }

      const deltaY = clientY - startYRef.current
      const deltaX = clientX - startXRef.current

      // Cancel if scrolling up or horizontal motion dominates
      if (deltaY <= 0 || Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (pullDistance > 0) {
          setPullDistance(0)
          setStatus("idle")
          setIsDragging(false)
        }
        return
      }

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0
      if (scrollY > 1) {
        isPullingRef.current = false
        setPullDistance(0)
        setStatus("idle")
        setIsDragging(false)
        return
      }

      if (cancelable) {
        preventDefault()
      }

      setIsDragging(true)
      setIsSettling(true)

      // Authentic Apple rubber-band friction formula
      const distance = Math.min(maxPull, Math.pow(deltaY, 0.85) * 1.5)
      setPullDistance(distance)

      if (distance >= threshold) {
        if (!hasTriggeredHapticRef.current) {
          playHapticFeedback()
          hasTriggeredHapticRef.current = true
        }
        setStatus("can-release")
      } else {
        hasTriggeredHapticRef.current = false
        setStatus("pulling")
      }
    },
    [maxPull, pullDistance, threshold]
  )

  const handleEnd = useCallback(async () => {
    if (!isPullingRef.current) return
    isPullingRef.current = false
    setIsDragging(false)

    if (statusRef.current === "can-release") {
      setStatus("refreshing")
      setPullDistance(56) // Resting height showing the spinner while loading

      try {
        await Promise.all([
          queryClient.invalidateQueries(),
          Promise.resolve(router.refresh()),
          new Promise((resolve) => setTimeout(resolve, 600)),
        ])

        setStatus("completed")
        await new Promise((resolve) => setTimeout(resolve, 350))
      } catch (err) {
        console.error("[PullToRefresh] Failed to refresh data:", err)
      } finally {
        setPullDistance(0)
        setStatus("idle")
      }
    } else {
      setPullDistance(0)
      setStatus("idle")
    }
  }, [queryClient, router])

  useEffect(() => {
    // Touch event listeners for mobile phones
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch)
        handleStart(
          touch.clientY,
          touch.clientX,
          e.target as HTMLElement | null
        )
    }

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        handleMove(touch.clientY, touch.clientX, e.cancelable, () =>
          e.preventDefault()
        )
      }
    }

    const onTouchEnd = () => handleEnd()

    // Pointer event listeners for desktop mouse drag / simulators
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      handleStart(e.clientY, e.clientX, e.target as HTMLElement | null)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.buttons !== 1) return
      handleMove(e.clientY, e.clientX, e.cancelable, () => e.preventDefault())
    }

    const onPointerUp = () => handleEnd()

    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd)
    window.addEventListener("touchcancel", onTouchEnd)

    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)

    return () => {
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("touchcancel", onTouchEnd)

      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [handleEnd, handleMove, handleStart])

  const isActivelyPulling =
    pullDistance > 0 || status === "refreshing" || status === "completed"
  const isTransformActive = pullDistance > 0 || isDragging || isSettling

  return (
    <div ref={containerRef} className="relative w-full overflow-visible">
      {/* Native Revealed Indicator in the opening gap above the content */}
      <div
        aria-hidden={!isActivelyPulling}
        className={cn(
          "pointer-events-none absolute top-0 right-0 left-0 z-30 flex items-center justify-center overflow-hidden select-none",
          isDragging
            ? "transition-none"
            : "transition-all duration-300 ease-out"
        )}
        style={{
          height: `${pullDistance}px`,
          opacity: Math.min(1, Math.max(0, (pullDistance - 12) / 36)),
        }}
      >
        <div
          className="flex items-center gap-2 rounded-full border border-border bg-card/90 px-3.5 py-1.5 shadow-md backdrop-blur-md"
          style={{
            transform: `scale(${0.85 + Math.min(1, pullDistance / 60) * 0.15})`,
          }}
        >
          {status === "refreshing" && (
            <>
              <RotateCw className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-medium text-foreground">
                Refreshing...
              </span>
            </>
          )}

          {status === "completed" && (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-foreground">
                Updated
              </span>
            </>
          )}

          {(status === "pulling" ||
            status === "can-release" ||
            (status === "idle" && pullDistance > 0)) && (
            <>
              {/* One persistent arrow: flips once at the threshold instead of rotating per pixel */}
              <ArrowDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200 ease-out",
                  status === "can-release"
                    ? "rotate-180 text-primary"
                    : "rotate-0 text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  status === "can-release"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {status === "can-release"
                  ? "Release to refresh"
                  : "Pull to refresh"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content Body (The hero, headers, cards physically translate down elastically) */}
      <div
        className={cn(
          "w-full",
          isTransformActive && "will-change-transform",
          isDragging
            ? "transition-none"
            : "transition-transform duration-350 ease-[cubic-bezier(0.18,0.89,0.32,1.28)]"
        )}
        style={{
          transform: isTransformActive
            ? `translate3d(0, ${pullDistance}px, 0)`
            : "none",
        }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && pullDistance === 0)
            setIsSettling(false)
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Named alias for backward compatibility
export const PullToRefresh = PullToRefreshContainer
