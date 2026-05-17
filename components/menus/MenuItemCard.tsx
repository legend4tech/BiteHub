"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ExternalLink } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import type { MenuItem } from "@/lib/types";
import { useState } from "react";
import { formatPrice, formatTime } from "@/lib/format";

interface MenuItemCardProps {
  item: MenuItem;
  onDifferentVendor?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onDifferentVendor }: MenuItemCardProps) {
  const { cart, addItem, updateQuantity, isDifferentVendor } = useCart();
  const [imgError, setImgError] = useState(false);

  const cartEntry = cart.items.find((ci) => ci.menuItem.id === item.id);
  const qty = cartEntry?.quantity ?? 0;
  const imageUrl =
    typeof item.image === "string" ? item.image : item.image?.url;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  const isScheduled = item.availableFrom && item.availableTo;
  const isOffSchedule =
    isScheduled &&
    (currentTime < item.availableFrom! || currentTime > item.availableTo!);
  const isCurrentlyAvailable = item.isAvailable && !isOffSchedule;

  const handleAdd = () => {
    if (!isCurrentlyAvailable) return;
    if (isDifferentVendor(item)) {
      onDifferentVendor?.(item);
      return;
    }
    addItem(item);
  };

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
    <article className="group rounded-2xl bg-card border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-6px_rgba(255,107,0,0.22)] flex flex-col">

      {/* ── Image ─────────────────────────────────────────── */}
      {/* overflow-hidden is ONLY here, not on the article root */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-muted shrink-0">
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
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}

        {item.tag && (
          <span className="absolute top-2.5 left-2.5 bg-background/95 backdrop-blur text-foreground text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-border">
            {item.tag}
          </span>
        )}

        {!isCurrentlyAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center flex-col gap-1.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {!item.isAvailable ? "Out of Stock" : "Closed"}
            </span>
            {isOffSchedule && (
              <span className="text-[10px] font-medium text-white/90 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                Opens {formatTime(item.availableFrom!)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      {/* flex-col + flex-1 fills card height; price row pins to bottom */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">

        {/* Vendor name */}
        {item.vendorSlug ? (
          <Link
            href={`/vendors/${item.vendorSlug}`}
            className="group/vendor inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-primary transition-colors w-fit max-w-full"
            title={`Go to ${item.vendorName}`}
          >
            <span className="truncate">{item.vendorName}</span>
            <ExternalLink className="size-2.5 shrink-0 text-primary/60 group-hover/vendor:text-primary" />
          </Link>
        ) : (
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground truncate">
            {item.vendorName}
          </p>
        )}

        {/* Item name — wraps freely, no truncation, pushes bottom row down */}
        <h3 className="font-heading font-semibold text-sm leading-snug flex-1">
          {item.name}
        </h3>

        {/* ── Price + Cart controls ──────────────────────── */}
        {/*
         * mt-auto pins this row to the bottom of every card.
         * Controls are explicitly sized (h-7 w-7 / h-8 w-8) so they
         * never overflow regardless of the card width.
         * No overflow-hidden above means they're always fully visible.
         */}
        <div className="flex items-center justify-between gap-1 mt-auto pt-2 border-t border-border/60">
          <p className="font-bold text-sm text-primary leading-none tabular-nums">
            {formatPrice(item.price)}
          </p>

          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!isCurrentlyAvailable}
              aria-label={`Add ${item.name} to cart`}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Plus className="size-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => updateQuantity(item.id, qty - 1)}
                aria-label="Decrease quantity"
                className="flex items-center justify-center h-7 w-7 rounded-lg border border-border bg-background hover:bg-muted active:scale-95 transition-all duration-150"
              >
                <Minus className="size-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => addItem(item)}
                aria-label="Increase quantity"
                disabled={!isCurrentlyAvailable}
                className="flex items-center justify-center h-7 w-7 rounded-xl bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="size-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
