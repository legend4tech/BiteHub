"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Target } from "lucide-react"
import { useCustomerProgress } from "@/hooks/customer/useCustomerProgress"
import Image from "next/image"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

export function FloatingBumpTracker() {
  const { data } = useCustomerProgress()
  const [isVisible, setIsVisible] = useState(false)
  const [activeBump, setActiveBump] = useState<{
    campaign: {
      id: string
      title: string
      targetCount: number
      [key: string]: unknown
    }
    progress: { currentCount: number; [key: string]: unknown }
  } | null>(null)

  useEffect(() => {
    if (!data?.campaigns || !data?.progress) return

    const dismissed = localStorage.getItem("bump_tracker_dismissed")

    // Find an active campaign that the user has started but not finished
    let foundBump = null
    for (const campaign of data.campaigns) {
      const prog = data.progress.find(
        (p: {
          campaignId: string
          currentCount: number
          isFullyCompleted: boolean
        }) => p.campaignId === campaign.id
      )
      if (prog && prog.currentCount > 0 && !prog.isFullyCompleted) {
        foundBump = { campaign, progress: prog }
        break
      }
    }

    if (foundBump && dismissed !== foundBump.campaign.id) {
      setTimeout(() => {
        setActiveBump(foundBump)
        setIsVisible(true)
      }, 0)
    }
  }, [data])

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (activeBump) {
      localStorage.setItem("bump_tracker_dismissed", activeBump.campaign.id)
    }
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && activeBump && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="fixed right-6 bottom-6 z-50 w-[300px]"
        >
          <Link href="/customer/rewards">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative rounded-2xl border border-primary/20 bg-background/80 p-4 shadow-2xl backdrop-blur-md"
            >
              {/* Mascot popping out */}
              <div className="absolute -top-12 -right-4 size-24 animate-[bounce_2s_infinite]">
                <Image
                  src="/avatars/mascot.png"
                  alt="Mascot"
                  fill
                  className="object-contain drop-shadow-md"
                />
              </div>

              <button
                onClick={handleDismiss}
                className="absolute top-2 left-2 rounded-full bg-muted/50 p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>

              <div className="mt-2 pr-12">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Target className="size-3.5" />
                  BUMP REWARD
                </div>
                <h4 className="mt-1 line-clamp-2 text-sm leading-tight font-bold text-foreground">
                  {activeBump.campaign.title}
                </h4>

                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-primary">
                      {activeBump.progress.currentCount} /{" "}
                      {activeBump.campaign.targetCount}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      (activeBump.progress.currentCount /
                        activeBump.campaign.targetCount) *
                        100,
                      100
                    )}
                    className="h-1.5"
                  />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
