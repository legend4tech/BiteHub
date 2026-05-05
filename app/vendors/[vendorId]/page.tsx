"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MenuItemCard } from "@/components/menus/MenuItemCard";
import { CartSummary } from "@/components/cart/CartSummary";
import { OrderForm } from "@/components/cart/OrderForm";
import { getVendorById, getMenuByVendor } from "@/lib/data";
import { MENU_CATEGORIES } from "@/lib/constants";
import { useCart } from "@/hooks/useCart";
import { MapPin, Circle } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import Image from "next/image";

export default function VendorDetailPage() {
  const params = useParams<{ vendorId: string }>();
  const vendor = getVendorById(params.vendorId);
  const allItems = getMenuByVendor(params.vendorId);

  const [activeCategory, setActiveCategory] = useState("all");
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null);
  const { clearAndAdd } = useCart();

  if (!vendor) return notFound();

  const categories = [
    { value: "all", label: "All", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop" },
    ...MENU_CATEGORIES.filter(
      (c) => c.value !== "all" && allItems.some((i) => i.category === c.value)
    ),
  ];

  const filtered =
    activeCategory === "all" ? allItems : allItems.filter((i) => i.category === activeCategory);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10 pb-28">
        {/* Vendor header */}
        <div className="rounded-3xl bg-card border border-border p-8 mb-8 flex items-start gap-6 flex-wrap">
          <div
            className="h-20 w-20 rounded-2xl grid place-items-center text-primary-foreground font-bold text-2xl shrink-0 bg-primary shadow-lg shadow-primary/20"
          >
            {vendor.initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{vendor.name}</h1>
              {vendor.isActive ? (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                  <Circle className="size-1.5 fill-current" /> Open now
                </span>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">Closed</span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">{vendor.tagline}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-4" /> {vendor.location}</span>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map((cat) => (
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

        {/* Menu grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onDifferentVendor={setConflictItem}
            />
          ))}
        </div>
      </div>

      <CartSummary onCheckout={() => setOrderFormOpen(true)} />
      <OrderForm open={orderFormOpen} onClose={() => setOrderFormOpen(false)} />

      {conflictItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConflictItem(null)} />
          <div className="relative bg-card border border-border rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-heading font-bold text-lg">Start a new cart?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Adding <strong>{conflictItem.name}</strong> will clear your current cart from a different vendor.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConflictItem(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors">Keep cart</button>
              <button onClick={() => { clearAndAdd(conflictItem); setConflictItem(null); }} className="flex-1 rounded-xl bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">Clear &amp; add</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
