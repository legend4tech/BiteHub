"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { X, Gift } from "lucide-react"
import { useCustomerProgress } from "@/hooks/customer/useCustomerProgress"
import Image from "next/image"
import Link from "next/link"

type ActiveBump = {
  campaign: {
    id: string
    title: string
    targetCount: number
    [key: string]: unknown
  }
  progress: { currentCount: number; [key: string]: unknown }
}

const DISMISS_KEY = "bump_tracker_dismissed"
const SLIDE_INTERVAL_MS = 4000

export function FloatingBumpTracker() {
  const { data } = useCustomerProgress()
  const reduceMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [bumps, setBumps] = useState<ActiveBump[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!data?.campaigns || !data?.progress) return

    // All campaigns the user has started but not finished
    const found: ActiveBump[] = []
    for (const campaign of data.campaigns) {
      const prog = data.progress.find(
        (p: {
          campaignId: string
          currentCount: number
          isFullyCompleted: boolean
        }) => p.campaignId === campaign.id
      )
      if (prog && prog.currentCount > 0 && !prog.isFullyCompleted) {
        found.push({ campaign, progress: prog })
      }
    }

    // Dismissal is stored as a signature of the active campaign ids
    const signature = found
      .map((b) => b.campaign.id)
      .sort()
      .join(",")
    let dismissed: string | null = null
    try {
      dismissed = localStorage.getItem(DISMISS_KEY)
    } catch {
      // storage unavailable, show the card anyway
    }

    const t = setTimeout(() => {
      if (found.length > 0 && dismissed !== signature) {
        setBumps(found)
        setIndex((i) => (i < found.length ? i : 0))
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }, 0)
    return () => clearTimeout(t)
  }, [data])

  // Auto-advance every 4s, paused while hovering/focusing; resets on manual change
  useEffect(() => {
    if (!isVisible || paused || bumps.length < 2) return
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % bumps.length),
      SLIDE_INTERVAL_MS
    )
    return () => clearTimeout(id)
  }, [isVisible, paused, bumps.length, index])

  const handleDismiss = () => {
    try {
      const signature = bumps
        .map((b) => b.campaign.id)
        .sort()
        .join(",")
      localStorage.setItem(DISMISS_KEY, signature)
    } catch {
      // ignore
    }
    setIsVisible(false)
  }

  const activeBump = bumps[index] ?? null
  const current = activeBump?.progress.currentCount ?? 0
  const target = activeBump?.campaign.targetCount ?? 0
  const percent =
    target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0
  const remaining = Math.max(target - current, 0)

  return (
    <AnimatePresence>
      {isVisible && activeBump && (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="fixed right-4 bottom-36 z-40 w-[150px]"
        >
          <div className="relative pt-12">
            {/* Soft glow under the card */}
            <div
              aria-hidden
              className="absolute inset-x-4 -bottom-2 h-8 rounded-full bg-primary/25 blur-xl"
            />

            <Link
              href="/customer/rewards"
              className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-border/70 bg-card px-3 pt-12 pb-3.5 text-center shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {/* Accent wash behind the mascot */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-primary/15 via-primary/5 to-transparent"
              />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeBump.campaign.id}
                  initial={
                    reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative flex w-full flex-col items-center"
                >
                  <h4 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-semibold text-foreground">
                    {activeBump.campaign.title}
                  </h4>

                  {/* Count */}
                  <div className="mt-2.5 flex items-baseline justify-center gap-0.5 tabular-nums">
                    <span className="text-2xl leading-none font-bold text-primary">
                      {current}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      / {target}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={target}
                    aria-valuenow={current}
                    aria-label="Bump reward progress"
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                      className="h-full rounded-full bg-linear-to-r from-primary/80 to-primary"
                    />
                  </div>

                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Gift className="size-3 text-primary" />
                    {remaining === 1
                      ? "1 more to go"
                      : `${remaining} more to go`}
                  </p>
                </motion.div>
              </AnimatePresence>
            </Link>

            {/* Carousel dots (only with 2+ vouchers), outside the link */}
            {bumps.length > 1 && (
              <div className="relative mt-2 flex items-center justify-center gap-1.5">
                {bumps.map((b, i) => (
                  <button
                    key={b.campaign.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show voucher ${i + 1} of ${bumps.length}`}
                    aria-current={i === index}
                    className={`h-1.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      i === index
                        ? "w-4 bg-primary"
                        : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Mascot breaking out of the top edge, centered */}
            <motion.div
              aria-hidden
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute top-0 left-1/2 z-10 h-[84px] w-[70px] -translate-x-1/2"
            >
              <Image
                src="/avatars/header_mascot.png"
                alt=""
                fill
                sizes="70px"
                className="object-contain drop-shadow-lg"
              />
            </motion.div>

            {/* Dismiss sits outside the link to avoid nested interactive elements */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss bump reward tracker"
              className="absolute top-14 right-2 z-20 rounded-full p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <X className="size-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
