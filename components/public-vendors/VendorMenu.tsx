"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { MenuItemCard } from "@/components/menus/MenuItemCard"
import { CartSummary } from "@/components/cart/CartSummary"
import { OrderForm } from "@/components/cart/OrderForm"
import { MENU_CATEGORIES } from "@/lib/constants"
import { useCart } from "@/hooks/useCart"
import type { MenuItem } from "@/lib/types"
import { FadeIn } from "@/components/FadeIn"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import Image from "next/image"

interface VendorMenuProps {
  // All items already filtered by the server (category/q applied on the backend)
  initialItems: MenuItem[]
  // The currently active category — read from the URL by the parent server component
  activeCategory: string
  // All categories this vendor has (unfiltered), used to build the tab list
  allCategories: string[]
}

export function VendorMenu({
  initialItems,
  activeCategory,
  allCategories,
}: VendorMenuProps) {
  const [orderFormOpen, setOrderFormOpen] = useState(false)
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null)
  const { clearAndAdd } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Build tabs from categories this vendor actually has (not from the filtered subset).
  // This ensures tabs don't disappear when you select a different category.
  const availableCategories = [
    {
      value: "all",
      label: "All",
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
    },
    ...MENU_CATEGORIES.filter(
      (c) => c.value !== "all" && allCategories.includes(c.value)
    ),
  ]

  // Items are already filtered by the backend — no client-side filtering needed
  const filtered = initialItems

  const handleCategoryClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault()
    startTransition(() => {
      router.push(href, { scroll: false })
    })
  }

  return (
    <>
      {/* Category tabs */}
      {availableCategories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {availableCategories.map((cat) => {
            const params = new URLSearchParams(searchParams)
            if (cat.value === "all") {
              params.delete("category")
            } else {
              params.set("category", cat.value)
            }
            const href = `?${params.toString()}`

            return (
              <a
                key={cat.value}
                href={href}
                onClick={(e) => handleCategoryClick(e, href)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  activeCategory === cat.value
                    ? "border-primary bg-primary text-white shadow-[0_4px_12px_-2px_rgba(255,107,0,0.4)]"
                    : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
                } ${isPending ? "pointer-events-none opacity-60" : ""}`}
              >
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
                {cat.label}
              </a>
            )
          })}
        </div>
      )}

      {/* Menu grid — show skeleton while category re-fetch is in flight */}
      {isPending ? (
        <div className="py-4">
          <PageSkeleton variant="menu-item-grid" count={8} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            activeCategory === "all"
              ? "No items available"
              : "Nothing in this category"
          }
          description={
            activeCategory === "all"
              ? "This vendor hasn't added any menu items yet. Check back soon."
              : "No items match this category. Try selecting a different one."
          }
          action={
            activeCategory !== "all"
              ? { label: "Show all items", href: "?" }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConflictItem(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-bold">
              Start a new cart?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Adding <strong>{conflictItem.name}</strong> will clear your
              current cart from a different vendor.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConflictItem(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Keep cart
              </button>
              <button
                onClick={() => {
                  clearAndAdd(conflictItem)
                  setConflictItem(null)
                }}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Clear &amp; add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
