"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

import { formatPrice } from "@/lib/format";

interface CartSummaryProps {
  onCheckout: () => void;
}

export function CartSummary({ onCheckout }: CartSummaryProps) {
  const { count, total, isEmpty, cart } = useCart();

  if (isEmpty) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
      <div
        className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary px-5 py-4 shadow-[0_8px_32px_-4px_rgba(var(--primary),0.35)] backdrop-blur-xl"
      >
        <div className="flex-1">
          <p className="text-primary-foreground font-bold text-sm">
            {count} item{count !== 1 ? "s" : ""} · {formatPrice(total)}
          </p>
          <p className="text-primary-foreground/80 text-xs">{cart.vendorName}</p>
        </div>
        <Button
          onClick={onCheckout}
          className="bg-white text-primary hover:bg-white/90 font-semibold rounded-xl shadow-none border-0"
          size="default"
        >
          <ShoppingBag className="size-4" />
          Place Order
        </Button>
      </div>
    </div>
  );
}
