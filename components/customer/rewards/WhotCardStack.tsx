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
              menuItem?: { name: string; price: number } | null
            },
            index: number
          ) => {
            // Calculate spread for the whot card fan effect
            const totalCards = Math.min(vouchers.length, 5) // display up to 5
            if (index >= 5) return null

            const isHovered = hoveredIndex === index
            const offset = (index - (totalCards - 1) / 2) * 15 // degrees
            const translateX = (index - (totalCards - 1) / 2) * 20 // px

            return (
              <div
                key={voucher.id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="absolute transition-all duration-300 ease-out"
                style={{
                  transform: `
                  translateX(${isHovered ? 0 : translateX}px)
                  translateY(${isHovered ? -20 : 0}px)
                  rotate(${isHovered ? 0 : offset}deg)
                  scale(${isHovered ? 1.1 : 1})
                `,
                  zIndex: isHovered ? 50 : index,
                }}
              >
                <div
                  className={`flex h-56 w-40 flex-col justify-between overflow-hidden rounded-xl border-4 border-white bg-white p-3 shadow-xl ${isHovered ? "animate-[shake_3s_ease-in-out_infinite] shadow-2xl shadow-primary/30" : ""} `}
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
                      {voucher.menuItem?.price
                        ? formatPrice(voucher.menuItem.price)
                        : ""}
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
                      <Link href={`/menu/${voucher.vendorId}`}>
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
