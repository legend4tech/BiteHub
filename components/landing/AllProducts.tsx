"use client";

import { useState } from "react";
import { MenuItemGrid } from "@/components/menus/MenuItemGrid";
import { CartSummary } from "@/components/cart/CartSummary";
import { OrderForm } from "@/components/cart/OrderForm";
import { MENU_CATEGORIES } from "@/lib/constants";
import { useCart } from "@/hooks/useCart";
import type { MenuItem } from "@/lib/types";
import { FadeIn } from "@/components/FadeIn";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ExternalLink } from "lucide-react";

interface AllProductsProps {
  initialItems: MenuItem[];
  activeCategory: string;
}

export function AllProducts({ initialItems, activeCategory }: AllProductsProps) {
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null);
  const { clearAndAdd } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filtered = initialItems;
  const displayItems = filtered.slice(0, 10);

  const handleDifferentVendor = (item: MenuItem) => setConflictItem(item);

  const handleClearAndAdd = () => {
    if (!conflictItem) return;
    clearAndAdd(conflictItem);
    setConflictItem(null);
  };

  return (
    <section id="menu" className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeIn delay={0.1}>
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                Everything on campus
              </p>
              <h2 className="font-heading text-3xl md:text-5xl font-bold mt-2">
                Meals, snacks &amp; drinks
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">{filtered.length} items</p>
            </div>
          </div>
        </FadeIn>

        {/* Category filter tabs */}
        <FadeIn delay={0.2}>
          <div className="flex gap-2 flex-wrap mb-8">
            {MENU_CATEGORIES.map((cat) => {
              const params = new URLSearchParams(searchParams);
              if (cat.value === "all") {
                params.delete("category");
              } else {
                params.set("category", cat.value);
              }
              const href = `?${params.toString()}#menu`;

              const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                startTransition(() => {
                  router.push(href);
                });
              };

              return (
                <a
                  key={cat.value}
                  href={href}
                  onClick={handleClick}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 border ${
                    activeCategory === cat.value
                      ? "bg-primary text-white border-primary shadow-[0_4px_12px_-2px_rgba(255,107,0,0.4)]"
                      : "bg-background border-border text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                    <Image src={cat.image} alt={cat.label} fill className="object-cover" sizes="24px" />
                  </div>
                  {cat.label}
                </a>
              );
            })}
          </div>
        </FadeIn>

        {/* Grid */}
        {isPending ? (
          <div className="py-8">
            <PageSkeleton variant="menu-item-grid" count={10} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nothing in this category"
            description="No meals are available for this filter right now. Try another category or check back soon."
            action={{ label: "View all menus", href: "/menus" }}
          />
        ) : (
          <MenuItemGrid items={displayItems} onDifferentVendor={handleDifferentVendor} keyPrefix="landing-" />
        )}

        <FadeIn delay={0.4}>
          <div className="mt-12 flex justify-center">
            <Button asChild variant="hero" size="xl" className="px-10 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform group">
              <Link href={activeCategory === "all" ? "/menus" : `/menus?category=${activeCategory}`} className="flex items-center gap-2 font-bold tracking-tight">
                View all menus <ExternalLink className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>

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
    </section>
  );
}
