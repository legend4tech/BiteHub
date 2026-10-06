"use client"

import { useState } from "react"
import { useCustomerVouchers } from "@/hooks/customer/useCustomerVouchers"
import { Gift, Copy, ExternalLink, Ticket, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"

export function WhotCardStack() {
  const { data: vouchers, isLoading } = useCustomerVouchers()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="flex h-64 animate-pulse items-center justify-center rounded-2xl bg-muted/50">
        <p className="font-bold text-muted-foreground">Shuffling cards...</p>
      </div>
    )
  }

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-6 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
          <Gift className="size-8" />
        </div>
        <h3 className="mb-2 text-lg font-bold">No Rewards Yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your reward vault is waiting! Crush those milestones or share your
          referral link to unlock mouth-watering free meals and shiny BiteHub
          Coins.
        </p>
      </div>
    )
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Voucher code copied!")
  }

  return (
    <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8">
      {/* Dynamic stacked Whot Cards */}
      <div className="relative flex h-full w-full max-w-xs items-center justify-center">
        {vouchers.map(
          (
            voucher: {
              id: string
              code: string
              vendorId: string
              menuItemId: string
              menuItem?: { name: string; priceInKobo: number } | null
              expiresAt: string
            },
            index: number
          ) => {
            // Dynamic spread for any number of cards
            const totalCards = vouchers.length
            // A lone card has no fan to reveal, so it must stay still.
            const isHovered = totalCards > 1 && hoveredIndex === index

            // Constrain the fan so it doesn't break the container
            const maxAngle = 45 // max degrees on either side
            const maxSpread = 120 // max pixels on either side

            const angleStep =
              totalCards > 1 ? (maxAngle * 2) / Math.max(totalCards - 1, 1) : 0
            const translateStep =
              totalCards > 1 ? (maxSpread * 2) / Math.max(totalCards - 1, 1) : 0

            // Cap the steps so few cards don't spread too wide
            const finalAngleStep = Math.min(angleStep, 15)
            const finalTranslateStep = Math.min(translateStep, 30)

            const offset = (index - (totalCards - 1) / 2) * finalAngleStep
            const translateX =
              (index - (totalCards - 1) / 2) * finalTranslateStep

            return (
              <div
                key={voucher.id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(isHovered ? null : index)}
                className="absolute cursor-pointer transition-all duration-300 ease-out"
                style={{
                  transform: `
                  translateX(${translateX}px)
                  rotate(${offset}deg)
                  translateY(${isHovered ? -40 : 0}px)
                  scale(${isHovered ? 1.05 : 1})
                `,
                  zIndex: isHovered ? 50 : index,
                }}
              >
                <div
                  className={`flex h-56 w-40 flex-col justify-between overflow-hidden rounded-xl border-4 border-border bg-card p-3 shadow-xl transition-all duration-300 ${isHovered ? "shadow-2xl shadow-primary/30" : ""} `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="size-3" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-primary uppercase">
                      FREE MEAL
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Ticket className="size-6" />
                    </div>
                    <h4 className="line-clamp-2 text-xs leading-tight font-bold">
                      {voucher.menuItem?.name || "Secret Reward"}
                    </h4>
                    <p className="mt-1 text-[10px] font-semibold text-muted-foreground line-through">
                      {voucher.menuItem?.priceInKobo
                        ? formatPrice(voucher.menuItem.priceInKobo)
                        : ""}
                    </p>

                    <p className="mt-1.5 text-[9px] font-bold tracking-wider text-destructive uppercase">
                      Exp:{" "}
                      {new Date(voucher.expiresAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-full text-[10px] font-bold"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(voucher.code)
                      }}
                    >
                      {voucher.code} <Copy className="ml-1 size-2" />
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      className="h-7 w-full text-[10px] font-bold"
                    >
                      <Link href={`/menu/${voucher.menuItemId}`}>
                        Order Now <ExternalLink className="ml-1 size-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}
