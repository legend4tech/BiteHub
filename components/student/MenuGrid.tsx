"use client";

import { useState } from "react";
import { MenuItemCard } from "@/components/student/MenuItemCard";
import { CartSummary } from "@/components/student/CartSummary";
import { OrderForm } from "@/components/student/OrderForm";
import { MENU_CATEGORIES } from "@/lib/constants";
import { useCart } from "@/hooks/useCart";
import type { MenuItem } from "@/lib/types";
import { FadeIn } from "@/components/FadeIn";
import Image from "next/image";

interface MenuGridProps {
  initialItems: MenuItem[];
}

export function MenuGrid({ initialItems }: MenuGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null);
  const { clearAndAdd } = useCart();

  const filtered = activeCategory === "all"
    ? initialItems
    : initialItems.filter((m) => m.category === activeCategory);

  const handleDifferentVendor = (item: MenuItem) => setConflictItem(item);

  const handleClearAndAdd = () => {
    if (!conflictItem) return;
    clearAndAdd(conflictItem);
    setConflictItem(null);
  };

  return (
    <>
      <FadeIn delay={0.2}>
        <div className="flex gap-2 flex-wrap mb-10">
          {MENU_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 border ${
                activeCategory === cat.value
                  ? "bg-primary text-white border-primary shadow-[0_4px_12px_-2px_rgba(255,107,0,0.4)]"
                  : "bg-background border-border text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 bg-muted">
                <Image src={cat.image} alt={cat.label} fill className="object-cover" sizes="24px" />
              </div>
              {cat.label}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-32 text-center text-muted-foreground">
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm mt-1">Try selecting a different category or change your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filtered.map((item, i) => (
            <FadeIn key={item.id} delay={0.05 * Math.min(i, 20)}>
              <MenuItemCard
                item={item}
                onDifferentVendor={handleDifferentVendor}
              />
            </FadeIn>
          ))}
        </div>
      )}

      {/* Floating cart */}
      <CartSummary onCheckout={() => setOrderFormOpen(true)} />

      {/* Order form */}
      <OrderForm open={orderFormOpen} onClose={() => setOrderFormOpen(false)} />

      {/* Cross-vendor conflict dialog */}
      {conflictItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConflictItem(null)} />
          <div className="relative bg-card border border-border rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-heading font-bold text-lg">Start a new cart?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Your cart has items from a different vendor. Adding{" "}
              <strong>{conflictItem.name}</strong> will clear your current cart.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConflictItem(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                Keep cart
              </button>
              <button onClick={handleClearAndAdd} className="flex-1 rounded-xl bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
                Clear &amp; add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
