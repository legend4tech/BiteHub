"use client"

import Image from "next/image"
import Link from "next/link"
import { Plus, Minus, ExternalLink, UtensilsCrossed, Clock } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import type { MenuItem } from "@/lib/types"
import { useState } from "react"
import {
  formatPrice,
  formatTime,
  isPreorderPrepTime,
  formatPrepTime,
} from "@/lib/format"
import { toast } from "sonner"

interface MenuItemCardProps {
  item: MenuItem
  onDifferentVendor?: (item: MenuItem) => void
}

export function MenuItemCard({ item, onDifferentVendor }: MenuItemCardProps) {
  const { cart, addItem, updateQuantity, isDifferentVendor } = useCart()
  const [imgError, setImgError] = useState(false)

  const cartEntry = cart.items.find((ci) => ci.menuItem.id === item.id)
  const qty = cartEntry?.quantity ?? 0
  const imageUrl = typeof item.image === "string" ? item.image : item.image?.url

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`
  const isScheduled = item.availableFrom && item.availableTo
  const isOffSchedule =
    isScheduled &&
    (currentTime < item.availableFrom! || currentTime > item.availableTo!)
  const isCurrentlyAvailable = item.isAvailable && !isOffSchedule

  const handleAdd = () => {
    if (!isCurrentlyAvailable) return
    if (isDifferentVendor(item)) {
      onDifferentVendor?.(item)
      return
    }
    const result = addItem(item)
    if (result && !result.success) {
      toast.error(result.error)
    }
  }

  return (
    /**
     * Root card — NO overflow-hidden here.
     * overflow-hidden belongs only on the image container so it
     * never clips the quantity stepper controls.
     *
     * Height consistency across a row is handled by CSS Grid (stretch).
     * Within the card, flex-col + flex-1 on the name + mt-auto on the
     * bottom row ensures price & buttons always sit flush at the bottom.
     */
    <article className="group flex flex-col rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-6px_rgba(255,107,0,0.22)]">
      {/* ── Image ─────────────────────────────────────────── */}
      {/* overflow-hidden is ONLY here, not on the article root */}
      <Link
        href={`/menu/${item.id}`}
        className="relative block aspect-[4/3] shrink-0 overflow-hidden rounded-t-2xl bg-muted"
      >
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
            <UtensilsCrossed className="size-8" />
          </div>
        )}

        {item.tag && (
          <span className="absolute top-2.5 left-2.5 rounded-full border border-border bg-background/95 px-2.5 py-0.5 text-[10px] font-semibold text-foreground">
            {item.tag}
          </span>
        )}

        {!isCurrentlyAvailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60">
            <span className="text-xs font-bold tracking-wider text-white uppercase">
              {!item.isAvailable ? "Out of Stock" : "Closed"}
            </span>
            {isOffSchedule && (
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/90">
                Opens {formatTime(item.availableFrom!)}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* ── Content ───────────────────────────────────────── */}
      {/* flex-col + flex-1 fills card height; price row pins to bottom */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* Vendor name */}
        {item.vendorSlug ? (
          <Link
            href={`/vendors/${item.vendorSlug}`}
            className="group/vendor inline-flex w-fit max-w-full items-center gap-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:text-primary"
            title={`Go to ${item.vendorName}`}
          >
            <span className="truncate">{item.vendorName}</span>
            <ExternalLink className="size-2.5 shrink-0 text-primary/60 group-hover/vendor:text-primary" />
          </Link>
        ) : (
          <p className="truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            {item.vendorName}
          </p>
        )}

        {/* Item name — wraps freely, no truncation, pushes bottom row down */}
        <Link
          href={`/menu/${item.id}`}
          className="flex-1 transition-colors group-hover:text-primary"
        >
          <h3 className="font-heading text-sm leading-snug font-semibold">
            {item.name}
          </h3>
        </Link>

        {(item.prepTimeValue && item.prepTimeUnit) || item.vendorPrepTime ? (
          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Clock className="size-3" />
            <span className="capitalize">
              {item.prepTimeValue && item.prepTimeUnit ? (
                <>
                  {isPreorderPrepTime(item.prepTimeValue, item.prepTimeUnit) ? (
                    <span className="font-bold text-primary">Pre-order: </span>
                  ) : (
                    "Prep time: "
                  )}
                  {formatPrepTime(item.prepTimeValue, item.prepTimeUnit)}
                </>
              ) : (
                `Prep time: ${item.vendorPrepTime}`
              )}
            </span>
          </div>
        ) : null}

        {/* ── Price + Cart controls ──────────────────────── */}
        {/*
         * mt-auto pins this row to the bottom of every card.
         * Controls are explicitly sized (h-7 w-7 / h-8 w-8) so they
         * never overflow regardless of the card width.
         * No overflow-hidden above means they're always fully visible.
         */}
        <div className="mt-auto flex items-center justify-between gap-1 border-t border-border/60 pt-2">
          <p className="text-sm leading-none font-bold text-primary tabular-nums">
            {formatPrice(item.price)}
          </p>

          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!isCurrentlyAvailable}
              aria-label={`Add ${item.name} to cart`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/25 transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-3.5" />
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                onClick={() => updateQuantity(item.id, qty - 1)}
                aria-label="Decrease quantity"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background transition-all duration-150 hover:bg-muted active:scale-95"
              >
                <Minus className="size-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => {
                  const result = addItem(item)
                  if (result && !result.success) {
                    toast.error(result.error)
                  }
                }}
                aria-label="Increase quantity"
                disabled={!isCurrentlyAvailable}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-white transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
