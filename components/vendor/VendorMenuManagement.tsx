"use client"

import { useState, useEffect, useTransition, useMemo, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { MenuItemCard } from "@/components/vendor/MenuItemCard"
import type { MenuItem } from "@/lib/types"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import apiClient from "@/lib/axios"
import { toast } from "sonner"
import { MENU_CATEGORIES } from "@/lib/constants"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"

interface VendorMenuManagementProps {
  initialItems: MenuItem[] // current filtered items from server
  allItems: MenuItem[] // all vendor items for stats and tab counts
  activeCategory: string // active category from URL
}

const ALL = "all"

// ─── Stats Strip ──────────────────────────────────────────────────────────────

function StatsStrip({ items }: { items: MenuItem[] }) {
  const total = items.length
  const listed = items.filter((i) => i.isAvailable).length
  const unlisted = total - listed

  const stats = [
    { label: "Total Items", value: total, color: "text-foreground" },
    {
      label: "Listed",
      value: listed,
      color: "text-green-600 dark:text-green-400",
    },
    { label: "Unlisted", value: unlisted, color: "text-destructive" },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col gap-0.5 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          <p
            className={cn(
              "font-heading text-2xl leading-none font-black",
              s.color
            )}
          >
            {s.value}
          </p>
          <p className="mt-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Category Filters ──────────────────────────────────────────────────────────

interface CategoryFiltersProps {
  active: string
  counts: Record<string, number>
  totalCount: number
  onChange: (cat: string) => void
  disabled?: boolean
}

function CategoryFilters({
  active,
  counts,
  totalCount,
  onChange,
  disabled,
}: CategoryFiltersProps) {
  const chips = [
    { value: ALL, label: "All" },
    ...MENU_CATEGORIES.filter((c) => c.value !== ALL),
  ]

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {chips.map((c) => {
        const isActive = active === c.value
        const count = c.value === ALL ? totalCount : (counts[c.value] ?? 0)

        return (
          <button
            key={c.value}
            disabled={disabled}
            onClick={() => onChange(c.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
              isActive
                ? "border-primary bg-primary text-white shadow-[0_4px_12px_-2px_rgba(255,107,0,0.4)]"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {c.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function VendorMenuManagement({
  initialItems,
  allItems,
  activeCategory,
}: VendorMenuManagementProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Retrieve current search term from URL
  const urlSearch = searchParams.get("search") || ""

  // Local state for instant search input text
  const [searchVal, setSearchVal] = useState(urlSearch)
  const debouncedSearch = useDebounce(searchVal, 350)

  // Sync state if URL changes externally
  useEffect(() => {
    setTimeout(() => setSearchVal(urlSearch), 0)
  }, [urlSearch])

  // Update active filters in Next.js URL (purely searchParams-driven server routing)
  const applyFilters = useCallback(
    (cat: string, search: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (search.trim()) {
        params.set("search", search.trim())
      } else {
        params.delete("search")
      }

      if (cat && cat !== ALL) {
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

  // When debounced local search value changes, push it to URL
  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      applyFilters(activeCategory, debouncedSearch)
    }
  }, [debouncedSearch, activeCategory, urlSearch, applyFilters])

  // Handle direct category chip selection
  const handleCategoryChange = (cat: string) => {
    applyFilters(cat, searchVal)
  }

  const clearFilters = () => {
    setSearchVal("")
    applyFilters(ALL, "")
  }

  // Build live item counts per category (from all items unfiltered)
  const categoryCounts = useMemo(() => {
    return allItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {})
  }, [allItems])

  const handleEdit = (item: MenuItem) => {
    router.push(`/vendor/menu/${item.id}/edit`)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/vendor/menu/${id}`)
      toast.success("Menu item deleted")
      router.refresh() // dynamically triggers server data refresh
    } catch {
      toast.error("Couldn't delete this item. Please try again.")
    }
  }

  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await apiClient.patch(`/vendor/menu/${id}`, { isAvailable })
      toast.success(
        isAvailable
          ? "Menu item listed successfully"
          : "Menu item unlisted successfully"
      )
      router.refresh() // dynamically triggers server data refresh
    } catch {
      toast.error("Couldn't update item availability. Try again.")
      throw new Error("API action failed") // propagate to let MenuItemCard restore local toggle state on error
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats bar — always computed from full vendor menu items list */}
      {allItems.length > 0 && <StatsStrip items={allItems} />}

      {/* Search Input and Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchVal}
            disabled={isPending}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search menu items…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pr-4 pl-10 text-sm transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/30 focus:outline-none disabled:opacity-70"
          />
        </div>

        <CategoryFilters
          active={activeCategory}
          counts={categoryCounts}
          totalCount={allItems.length}
          onChange={handleCategoryChange}
          disabled={isPending}
        />
      </div>

      {/* Content Rendering Grid */}
      {isPending ? (
        <div className="py-2">
          <PageSkeleton variant="menu-card-grid" count={6} />
        </div>
      ) : allItems.length === 0 ? (
        /* The vendor has never created any menu items yet */
        <EmptyState
          size="md"
          title="No menu items yet"
          description="Start building your menu. Add your first dish to make it visible to students."
          action={{ label: "Add first item", href: "/vendor/menu/new" }}
        />
      ) : initialItems.length === 0 ? (
        /* Search/Category filter yielded no matches */
        <EmptyState
          size="sm"
          title="No items match"
          description="Try selecting another category or typing another keyword."
          action={{ label: "Clear filters", onClick: clearFilters }}
        />
      ) : (
        /* Active menu card grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      )}
    </div>
  )
}
