"use client";

import Image from "next/image";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import type { MenuItem } from "@/lib/types";
import { useState } from "react";
import { formatPrice } from "@/lib/format";

interface MenuItemCardProps {
  item: MenuItem;
  onDifferentVendor?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onDifferentVendor }: MenuItemCardProps) {
  const { cart, addItem, removeItem, updateQuantity, isDifferentVendor } = useCart();
  const [imgError, setImgError] = useState(false);

  const cartEntry = cart.items.find((ci) => ci.menuItem.id === item.id);
  const qty = cartEntry?.quantity ?? 0;

  const handleAdd = () => {
    if (!item.isAvailable) return;
    if (isDifferentVendor(item)) {
      onDifferentVendor?.(item);
      return;
    }
    addItem(item);
  };

  return (
    <article className="group rounded-xl bg-card border border-border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_-6px_rgba(255,107,0,0.25)] flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {item.image && !imgError ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}

        {item.tag && (
          <span className="absolute top-3 left-3 bg-background/95 backdrop-blur text-foreground text-xs font-semibold px-3 py-1 rounded-full border border-border">
            {item.tag}
          </span>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-sm font-semibold text-muted-foreground">Not available</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground">{item.vendorName}</p>
        <h3 className="font-heading font-semibold text-base mt-1 leading-tight flex-1">
          {item.name}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-bold text-lg text-primary">{formatPrice(item.price)}</p>

          {qty === 0 ? (
            <Button
              size="icon"
              variant="hero"
              onClick={handleAdd}
              disabled={!item.isAvailable}
              aria-label={`Add ${item.name} to cart`}
              className="h-9 w-9 rounded-xl"
            >
              <Plus className="size-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-xl"
                onClick={() => updateQuantity(item.id, qty - 1)}
                aria-label="Decrease quantity"
              >
                <Minus className="size-3" />
              </Button>
              <span className="w-6 text-center text-sm font-bold">{qty}</span>
              <Button
                size="icon"
                variant="hero"
                className="h-8 w-8 rounded-xl"
                onClick={() => addItem(item)}
                aria-label="Increase quantity"
              >
                <Plus className="size-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
