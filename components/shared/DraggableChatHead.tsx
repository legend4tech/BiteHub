"use client"

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react"
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  type PanInfo,
} from "framer-motion"
import { Headset, X } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "bitehub_chat_head_pos"
const GREETING_STORAGE_KEY = "bitehub_chat_greet_dismissed"
const BUTTON_SIZE = 56
const EDGE_MARGIN = 16
const MIN_HEADER_OFFSET = 72
const MIN_FOOTER_OFFSET = 80

interface SavedPosition {
  edge: "left" | "right"
  yRatio: number
}

// Gentle 2-tone audio chime using native Web Audio API (zero external assets)
function playGreetingChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    // Warm harmonic interval: E5 (659.25Hz) -> G#5 (830.61Hz)
    osc.frequency.setValueAtTime(659.25, now)
    osc.frequency.exponentialRampToValueAtTime(830.61, now + 0.1)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.55)
  } catch {
    // Graceful fallback if audio playback is blocked by policy
  }
}

function getInitialPosition(): SavedPosition {
  if (typeof window === "undefined") return { edge: "right", yRatio: 0.8 }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as SavedPosition
      if (
        (parsed.edge === "left" || parsed.edge === "right") &&
        typeof parsed.yRatio === "number"
      ) {
        return parsed
      }
    }
  } catch {
    // Fallback to default position if storage is inaccessible
  }
  return { edge: "right", yRatio: 0.8 }
}

export function DraggableChatHead() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [unreadCount, setUnreadCount] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const [hasUnreadAlert, setHasUnreadAlert] = useState(false)
  const [currentEdge, setCurrentEdge] = useState<"left" | "right">(
    () => getInitialPosition().edge
  )
  const controls = useAnimationControls()
  const isDraggingRef = useRef(false)
  const positionRef = useRef<SavedPosition>(getInitialPosition())

  // Calculate target X/Y coordinates based on edge and vertical ratio
  const calculateCoordinates = useCallback(
    (pos: SavedPosition, width: number, height: number) => {
      const x =
        pos.edge === "left"
          ? EDGE_MARGIN
          : Math.max(EDGE_MARGIN, width - BUTTON_SIZE - EDGE_MARGIN)
      const rawY = pos.yRatio * height
      const minY = MIN_HEADER_OFFSET
      const maxY = Math.max(minY, height - BUTTON_SIZE - MIN_FOOTER_OFFSET)
      const y = Math.max(minY, Math.min(maxY, rawY))
      return { x, y }
    },
    []
  )

  // Initialize position from localStorage or sensible mobile default
  useEffect(() => {
    positionRef.current = getInitialPosition()

    const { x, y } = calculateCoordinates(
      positionRef.current,
      window.innerWidth,
      window.innerHeight
    )
    controls.set({ x, y })

    // Subscribe to Tawk_API unread count and chat visibility if available
    const checkTawkAPI = () => {
      if (typeof window !== "undefined" && window.Tawk_API) {
        if (!isChatOpen && typeof window.Tawk_API.hideWidget === "function") {
          window.Tawk_API.hideWidget()
        }
        window.Tawk_API.onUnreadCountChanged = (count: number) => {
          setUnreadCount(count)
          if (count > 0 && !isChatOpen) {
            setHasUnreadAlert(true)
            playGreetingChime()
          }
        }
        window.Tawk_API.onChatMessageAgent = () => {
          if (!isChatOpen) {
            setHasUnreadAlert(true)
            playGreetingChime()
          }
        }
        window.Tawk_API.onChatMaximized = () => {
          setIsChatOpen(true)
          setShowGreeting(false)
          setHasUnreadAlert(false)
        }
        window.Tawk_API.onChatMinimized = () => {
          setIsChatOpen(false)
          window.Tawk_API?.hideWidget?.()
        }
        window.Tawk_API.onChatHidden = () => {
          setIsChatOpen(false)
          window.Tawk_API?.hideWidget?.()
        }
      }
    }

    checkTawkAPI()
    const timer = setTimeout(checkTawkAPI, 1000)

    const handleResize = () => {
      const coords = calculateCoordinates(
        positionRef.current,
        window.innerWidth,
        window.innerHeight
      )
      controls.start({
        x: coords.x,
        y: coords.y,
        transition: { type: "spring", stiffness: 350, damping: 28 },
      })
    }

    window.addEventListener("resize", handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", handleResize)
    }
  }, [controls, calculateCoordinates, isChatOpen])

  // Welcome greeting bubble timer (delayed 3.5s after visit)
  useEffect(() => {
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(GREETING_STORAGE_KEY) === "true"
    } catch {
      // Ignore storage errors in private browsing
    }

    if (!dismissed) {
      const greetTimer = setTimeout(() => {
        if (!isChatOpen) {
          setShowGreeting(true)
          setHasUnreadAlert(true)
          playGreetingChime()
        }
      }, 3500)
      return () => clearTimeout(greetTimer)
    }
  }, [isChatOpen])

  // Tab Title Flashing Alert ("🔔 (1) New message!" <-> original title)
  useEffect(() => {
    if (!hasUnreadAlert || isChatOpen) return

    const originalTitle = document.title
    let isAlt = false

    const interval = setInterval(() => {
      isAlt = !isAlt
      document.title = isAlt ? "🔔 (1) New message!" : originalTitle
    }, 1500)

    const handleFocus = () => {
      document.title = originalTitle
      setHasUnreadAlert(false)
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
      document.title = originalTitle
    }
  }, [hasUnreadAlert, isChatOpen])

  // Handle drag completion and snap to nearest edge
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    isDraggingRef.current = false
    const width = window.innerWidth
    const height = window.innerHeight

    // info.point contains page coordinates (pageY includes window.scrollY).
    // Convert to viewport coordinates so scrolling does not break dragging.
    const clientX = info.point.x - window.scrollX
    const clientY = info.point.y - window.scrollY

    const snappedEdge: "left" | "right" = clientX < width / 2 ? "left" : "right"
    const targetY = clientY - BUTTON_SIZE / 2
    const minY = MIN_HEADER_OFFSET
    const maxY = Math.max(minY, height - BUTTON_SIZE - MIN_FOOTER_OFFSET)
    const clampedY = Math.max(minY, Math.min(maxY, targetY))
    const clampedYRatio = clampedY / height

    const newPos: SavedPosition = { edge: snappedEdge, yRatio: clampedYRatio }
    positionRef.current = newPos
    setCurrentEdge(snappedEdge)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos))
    } catch {
      // Ignore storage errors in private mode
    }

    const { x, y } = calculateCoordinates(newPos, width, height)
    controls.start({
      x,
      y,
      transition: { type: "spring", stiffness: 400, damping: 25 },
    })
  }

  const handleTap = () => {
    setShowGreeting(false)
    setHasUnreadAlert(false)
    if (typeof window !== "undefined" && window.Tawk_API) {
      if (typeof window.Tawk_API.maximize === "function") {
        window.Tawk_API.maximize()
      } else if (typeof window.Tawk_API.toggle === "function") {
        window.Tawk_API.toggle()
      }
    }
  }

  const handleDismissGreeting = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowGreeting(false)
    setHasUnreadAlert(false)
    try {
      sessionStorage.setItem(GREETING_STORAGE_KEY, "true")
    } catch {
      // Ignore storage errors in private browsing
    }
  }

  if (!mounted || isChatOpen) {
    return null
  }

  return (
    <motion.div
      animate={controls}
      drag
      dragElastic={0.08}
      dragMomentum={false}
      onDragStart={() => {
        isDraggingRef.current = true
      }}
      onDragEnd={handleDragEnd}
      className="fixed top-0 left-0 z-50 flex touch-none items-center select-none"
    >
      {/* Floating Greeting Speech Bubble ("We are here!" with X close button) */}
      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
              x: currentEdge === "right" ? 12 : -12,
            }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{
              opacity: 0,
              scale: 0.9,
              x: currentEdge === "right" ? 12 : -12,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            onClick={handleTap}
            className={cn(
              "group absolute top-1/2 z-20 w-64 -translate-y-1/2 cursor-pointer rounded-2xl border border-border bg-card/95 p-3 text-card-foreground shadow-2xl backdrop-blur-md select-none",
              currentEdge === "right" ? "right-full mr-3" : "left-full ml-3"
            )}
          >
            {/* Directional Triangle Pointer */}
            <span
              className={cn(
                "pointer-events-none absolute top-1/2 size-2.5 -translate-y-1/2 rotate-45 border-border bg-card/95",
                currentEdge === "right"
                  ? "-right-1.5 border-t border-r"
                  : "-left-1.5 border-b border-l"
              )}
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Customer Support
                </span>
              </div>

              <button
                type="button"
                onClick={handleDismissGreeting}
                aria-label="Dismiss message"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              We&apos;re here! Need help finding campus kitchens or ordering?
            </p>

            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary group-hover:underline">
              <span>Start live chat</span>
              <span aria-hidden="true">→</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Draggable Chat Button */}
      <button
        type="button"
        onClick={() => {
          if (!isDraggingRef.current) {
            handleTap()
          }
        }}
        aria-label="Contact Customer Support"
        title="Contact Customer Support (Drag to move to any edge)"
        className="relative flex size-14 cursor-grab items-center justify-center rounded-full border border-primary-foreground/20 bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 active:cursor-grabbing"
      >
        <Headset className="size-6 text-primary-foreground" />

        {/* Live Online Indicator Ping */}
        <span className="absolute right-1 bottom-1 flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-success ring-2 ring-primary" />
        </span>

        {/* Unread Message Count Badge */}
        {unreadCount > 0 && (
          <span className="text-destructive-foreground absolute -top-1 -right-1 flex h-5 min-w-5 animate-bounce items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold ring-2 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </motion.div>
  )
}
