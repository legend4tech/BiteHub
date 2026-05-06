"use client";

import { useState } from "react";
import { MenuItemCard } from "@/components/menus/MenuItemCard";
import { CartSummary } from "@/components/cart/CartSummary";
import { OrderForm } from "@/components/cart/OrderForm";
import { MENU_CATEGORIES } from "@/lib/constants";
import { useCart } from "@/hooks/useCart";
import type { MenuItem } from "@/lib/types";
import { FadeIn } from "@/components/FadeIn";
import { EmptyState } from "@/components/shared/EmptyState";
import Image from "next/image";

interface VendorMenuProps {
  initialItems: MenuItem[];
}

export function VendorMenu({ initialItems }: VendorMenuProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null);
  const { clearAndAdd } = useCart();

  // Build category tabs from items that actually exist in this vendor's menu
  const availableCategories = [
    {
      value: "all",
      label: "All",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
    },
    ...MENU_CATEGORIES.filter(
      (c) => c.value !== "all" && initialItems.some((i) => i.category === c.value)
    ),
  ];

  const filtered =
    activeCategory === "all"
      ? initialItems
      : initialItems.filter((i) => i.category === activeCategory);

  return (
    <>
      {/* Category tabs */}
      {availableCategories.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {availableCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all border ${
                activeCategory === cat.value
                  ? "bg-primary text-white border-primary shadow-[0_4px_12px_-2px_rgba(255,107,0,0.4)]"
                  : "bg-background border-border text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                <Image src={cat.image} alt={cat.label} fill className="object-cover" sizes="24px" />
              </div>
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Menu grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={activeCategory === "all" ? "No items available" : "Nothing in this category"}
          description={
            activeCategory === "all"
              ? "This vendor hasn't added any menu items yet. Check back soon."
              : "No items match this category. Try selecting a different one."
          }
          action={
            activeCategory !== "all"
              ? { label: "Show all items", onClick: () => setActiveCategory("all") }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => (
            <FadeIn key={item.id} delay={0.04 * Math.min(i, 20)}>
              <MenuItemCard item={item} onDifferentVendor={setConflictItem} />
            </FadeIn>
          ))}
        </div>
      )}

      {/* Floating cart */}
      <CartSummary onCheckout={() => setOrderFormOpen(true)} />
      <OrderForm open={orderFormOpen} onClose={() => setOrderFormOpen(false)} />

      {/* Cross-vendor conflict dialog */}
      {conflictItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConflictItem(null)} />
          <div className="relative bg-card border border-border rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-heading font-bold text-lg">Start a new cart?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Adding <strong>{conflictItem.name}</strong> will clear your current cart from a different vendor.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConflictItem(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Keep cart
              </button>
              <button
                onClick={() => { clearAndAdd(conflictItem); setConflictItem(null); }}
                className="flex-1 rounded-xl bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Clear &amp; add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
