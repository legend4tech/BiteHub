"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Plus,
  Minus,
  ExternalLink,
  UtensilsCrossed,
  Clock,
  Trash2,
  Star,
} from "lucide-react"
import { useCart } from "@/hooks/useCart"
import type { MenuItem } from "@/types/vendor"
import { useState, useEffect } from "react"
import {
  formatPrice,
  formatTime,
  formatPrepTime,
  isItemAvailableToday,
  formatPreorderDeliveryDate,
} from "@/lib/format"
import { toast } from "sonner"

interface MenuItemCardProps {
  item: MenuItem
  onDifferentVendor?: (item: MenuItem) => void
}

export function MenuItemCard({ item, onDifferentVendor }: MenuItemCardProps) {
  const { cart, addItem, updateQuantity, isDifferentVendor, syncItem } =
    useCart()
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    syncItem(item)
  }, [item, syncItem])

  const cartEntry = cart.items.find((ci) => ci.menuItem.id === item.id)
  const qty = cartEntry?.quantity ?? 0
  const imageUrl = typeof item.image === "string" ? item.image : item.image?.url

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`

  const isAvailableToday = item.isPreorder
    ? true
    : isItemAvailableToday(item.availableDays)

  const isScheduled = !item.isPreorder && item.availableFrom && item.availableTo
  const isOffSchedule =
    isScheduled &&
    (currentTime < item.availableFrom! || currentTime > item.availableTo!)

  const isPreorderClosed = Boolean(
    item.isPreorder &&
    item.preorderEndDate &&
    now > new Date(item.preorderEndDate)
  )

  const isSoldOut =
    item.quantityAvailable !== null &&
    item.quantityAvailable !== undefined &&
    item.quantityAvailable <= 0

  const isCurrentlyAvailable =
    item.isAvailable &&
    isAvailableToday &&
    !isSoldOut &&
    !isOffSchedule &&
    !isPreorderClosed &&
    item.vendorIsActive !== false // false = explicitly closed; undefined = assume active

  const handleAdd = () => {
    if (!isCurrentlyAvailable) return

    // Prevent adding more than available quantity
    if (
      item.quantityAvailable !== null &&
      item.quantityAvailable !== undefined &&
      qty >= item.quantityAvailable
    ) {
      toast.error(`Only ${item.quantityAvailable} available.`)
      return
    }

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
          <span className="absolute top-2.5 left-2.5 rounded-full border border-border bg-background/95 px-2.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
            {item.tag}
          </span>
        )}

        {item.isPreorder && (
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
            <span className="rounded-full border border-primary bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary shadow-sm backdrop-blur-md">
              Pre-order
            </span>
            {item.preorderEndDate && (
              <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm backdrop-blur-md">
                {isPreorderClosed ? "Closed: " : "Closes: "}
                {new Date(item.preorderEndDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        )}

        {!isCurrentlyAvailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-center shadow-2xl backdrop-blur-md">
              <span className="text-xs font-black tracking-widest text-white uppercase drop-shadow-md">
                {!item.isAvailable
                  ? "Unlisted"
                  : item.vendorIsActive === false
                    ? "Vendor Closed"
                    : !isAvailableToday
                      ? "Unavailable"
                      : isSoldOut
                        ? "Sold Out"
                        : isPreorderClosed
                          ? "Closed"
                          : "Closed"}
              </span>
              {(!isAvailableToday || isSoldOut || isOffSchedule) &&
                item.isAvailable && (
                  <span className="text-[10px] font-medium text-white/90">
                    {isOffSchedule && !isSoldOut && isAvailableToday
                      ? `Opens ${formatTime(item.availableFrom!)}`
                      : "Check back later"}
                  </span>
                )}
            </div>
          </div>
        )}

        {isCurrentlyAvailable &&
          item.quantityAvailable !== null &&
          item.quantityAvailable !== undefined &&
          item.quantityAvailable <= 5 &&
          item.quantityAvailable > 0 && (
            <span className="absolute bottom-2.5 left-2.5 z-10 rounded-full border border-border bg-warning/10 px-2.5 py-0.5 text-[10px] font-semibold text-warning shadow-sm">
              Limited: {item.quantityAvailable} left
            </span>
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
          {(item.rating ?? 0) > 0 && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Star className="size-3 fill-warning text-warning" />
              <span className="text-foreground">{item.rating?.toFixed(1)}</span>
              <span className="font-normal">({item.ratingCount})</span>
            </div>
          )}
        </Link>

        {item.isPreorder &&
        (item.preorderDeliveryInfo || item.preorderEndDate) ? (
          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Clock className="size-3 text-primary" />
            <span className="truncate font-semibold text-primary capitalize">
              {item.preorderDeliveryInfo ||
                formatPreorderDeliveryDate(item.preorderEndDate!)}
            </span>
          </div>
        ) : (item.prepTimeValue && item.prepTimeUnit) || item.vendorPrepTime ? (
          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Clock className="size-3" />
            <span className="capitalize">
              {item.prepTimeValue && item.prepTimeUnit
                ? `Prep time: ${formatPrepTime(item.prepTimeValue, item.prepTimeUnit)}`
                : `Prep time: ${item.vendorPrepTime}`}
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

          {qty > 0 && !isCurrentlyAvailable ? (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                updateQuantity(item.id, 0)
              }}
              aria-label="Remove from cart"
              className="group flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3 text-[10px] font-bold tracking-wider text-destructive uppercase transition-all duration-300 hover:bg-destructive/20 active:scale-95 dark:hover:bg-destructive/30"
            >
              <Trash2 className="size-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
              <span>Remove</span>
            </button>
          ) : qty === 0 ? (
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
                  if (
                    item.quantityAvailable !== null &&
                    item.quantityAvailable !== undefined &&
                    qty >= item.quantityAvailable
                  ) {
                    toast.error(`Only ${item.quantityAvailable} available.`)
                    return
                  }
                  const result = addItem(item)
                  if (result && !result.success) {
                    toast.error(result.error)
                  }
                }}
                aria-label="Increase quantity"
                disabled={
                  !isCurrentlyAvailable ||
                  (item.quantityAvailable !== null &&
                    item.quantityAvailable !== undefined &&
                    qty >= item.quantityAvailable)
                }
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
