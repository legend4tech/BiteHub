"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { MenuItemCard } from "@/components/menus/MenuItemCard"
import { CartSummary } from "@/components/cart/CartSummary"
import { CartSheet } from "@/components/cart/CartSheet"
import { MENU_CATEGORIES } from "@/lib/constants"
import { useCart } from "@/hooks/useCart"
import type { MenuItem } from "@/types/vendor"
import { FadeIn } from "@/components/FadeIn"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import Image from "next/image"
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"

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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const urlSearch = searchParams.get("q") || ""
  const [searchVal, setSearchVal] = useState(urlSearch)
  const debouncedSearch = useDebounce(searchVal, 350)

  // Client-side filters & sorting
  const [showFilters, setShowFilters] = useState(false)
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState("none") // none, price_asc, price_desc, name_asc

  useEffect(() => {
    setTimeout(() => setSearchVal(urlSearch), 0)
  }, [urlSearch])

  const applyFilters = useCallback(
    (cat: string, search: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (search.trim()) {
        params.set("q", search.trim())
      } else {
        params.delete("q")
      }

      if (cat && cat !== "all") {
        params.set("category", cat)
      } else {
        params.delete("category")
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      applyFilters(activeCategory, debouncedSearch)
    }
  }, [debouncedSearch, activeCategory, urlSearch, applyFilters])

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

  // Apply client-side sorting and filtering
  const filtered = initialItems
    .filter((item) => {
      if (showAvailableOnly && item.isAvailableNow === false) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price
      if (sortBy === "price_desc") return b.price - a.price
      if (sortBy === "name_asc") return a.name.localeCompare(b.name)
      return 0
    })

  const handleCategoryClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    catValue: string
  ) => {
    e.preventDefault()
    applyFilters(catValue, searchVal)
  }

  return (
    <div className="space-y-6">
      {/* Search Input & Filters Toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchVal}
            disabled={isPending}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search menu items…"
            className="w-full rounded-2xl border border-border bg-card py-3.5 pr-4 pl-10 text-base transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/30 focus:outline-none disabled:opacity-70"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors md:px-5 ${
            showFilters || showAvailableOnly || sortBy !== "none"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden md:inline">Filters</span>
        </button>
      </div>

      {/* Expanded Filters panel */}
      {showFilters && (
        <FadeIn className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={(e) => setShowAvailableOnly(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary"></div>
                  <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </div>
                <span className="text-sm font-medium select-none">
                  Available to order now
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <ArrowUpDown className="size-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-border bg-background py-2 pr-8 pl-3 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/30 focus:outline-none"
              >
                <option value="none">Sort by: Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Category tabs */}
      {availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-2">
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
                onClick={(e) => handleCategoryClick(e, cat.value)}
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
    </div>
  )
}
