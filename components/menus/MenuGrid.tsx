"use client"

import { useState } from "react"
import { MenuItemGrid } from "@/components/menus/MenuItemGrid"
import { CartSummary } from "@/components/cart/CartSummary"
import { CartSheet } from "@/components/cart/CartSheet"
import { MENU_CATEGORIES } from "@/lib/constants"
import { useCart } from "@/hooks/useCart"
import type { MenuItem } from "@/types/vendor"
import { FadeIn } from "@/components/FadeIn"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"

interface MenuGridProps {
  initialItems: MenuItem[]
  activeCategory: string
}

export function MenuGrid({ initialItems, activeCategory }: MenuGridProps) {
  const [orderFormOpen, setOrderFormOpen] = useState(false)
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null)
  const { clearAndAdd } = useCart()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // initialItems are already filtered by the server based on the category!
  const filtered = initialItems

  const handleDifferentVendor = (item: MenuItem) => setConflictItem(item)

  const handleClearAndAdd = () => {
    if (!conflictItem) return
    clearAndAdd(conflictItem)
    setConflictItem(null)
  }

  return (
    <>
      <FadeIn delay={0.2}>
        <div className="mb-10 flex flex-wrap gap-2">
          {MENU_CATEGORIES.map((cat) => {
            const params = new URLSearchParams(searchParams)
            if (cat.value === "all") {
              params.delete("category")
            } else {
              params.set("category", cat.value)
            }
            const href = `?${params.toString()}`

            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault()
              startTransition(() => {
                router.push(href)
              })
            }

            return (
              <a
                key={cat.value}
                href={href}
                onClick={handleClick}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 ${
                  activeCategory === cat.value
                    ? "border-primary bg-primary text-white shadow-[0_4px_12px_-2px_rgba(255,107,0,0.4)]"
                    : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
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
      </FadeIn>

      {/* Grid */}
      {isPending ? (
        <div className="py-8">
          <PageSkeleton variant="menu-item-grid" count={12} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No items found`}
          description="Nothing matched your search or filter. Try a different category or clear the search."
          action={{ label: "Clear filters", href: "/menus" }}
        />
      ) : (
        <MenuItemGrid
          items={filtered}
          onDifferentVendor={handleDifferentVendor}
        />
      )}

      {/* Floating cart */}
      <CartSummary onCheckout={() => setOrderFormOpen(true)} />

      {/* Cart Sheet */}
      <CartSheet open={orderFormOpen} onClose={() => setOrderFormOpen(false)} />

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
              Your cart has items from a different vendor. Adding{" "}
              <strong>{conflictItem.name}</strong> will clear your current cart.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConflictItem(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Keep cart
              </button>
              <button
                onClick={handleClearAndAdd}
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
