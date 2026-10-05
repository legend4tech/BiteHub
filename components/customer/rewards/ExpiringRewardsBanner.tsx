"use client"

import { useState } from "react"
import { AlertCircle, ChevronRight, Clock } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/types/customer"

export function ExpiringRewardsBanner({ rewards }: { rewards: Transaction[] }) {
  const [open, setOpen] = useState(false)

  if (!rewards || rewards.length === 0) return null

  // The first item is the nearest expiration due to backend sorting
  const nearest = rewards[0]
  const nearestAmount = nearest.remainingAmount ?? nearest.amount
  const nearestDate = nearest.expiresAt
    ? format(new Date(nearest.expiresAt), "MMM do")
    : "Soon"

  return (
    <>
      <div className="mt-2 flex items-center justify-between rounded-lg border border-warning/20 bg-warning/10 px-3 py-2">
        <div className="flex items-center gap-2 text-warning">
          <AlertCircle className="size-4" />
          <span className="text-xs font-medium">
            {nearestAmount} BHC expire on {nearestDate}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center text-xs font-medium text-warning hover:underline"
        >
          View All <ChevronRight className="size-3" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-5 text-warning" />
              Expiring Coins
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Your promotional BiteHub Coins have specific expiration dates. Use
              them before they expire!
            </p>
            <div className="relative ml-2 space-y-6 border-l-2 border-muted pl-4">
              {rewards.map((reward, i) => (
                <div key={i} className="relative">
                  <div className="absolute top-1 -left-[21px] size-3 rounded-full border-2 border-background bg-warning" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {reward.remainingAmount ?? reward.amount} BHC
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reward.expiresAt
                          ? format(new Date(reward.expiresAt), "MMM do, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
