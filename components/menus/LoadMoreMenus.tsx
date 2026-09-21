"use client"

import { useState } from "react"
import { useMenuItems } from "@/hooks/shared/useMenuItems"
import { MenuItemGrid } from "@/components/menus/MenuItemGrid"

import { FetchError } from "@/components/shared/FetchError"
import type { MenuItem } from "@/types/vendor"
import { useCart } from "@/hooks/useCart"
import { InfiniteScrollTrigger } from "@/components/shared/InfiniteScrollTrigger"

interface LoadMoreMenusProps {
  initialPage: number
  limit?: number
  searchParams: { [key: string]: string | undefined }
}

export function LoadMoreMenus({
  initialPage,
  limit = 20,
  searchParams,
}: LoadMoreMenusProps) {
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null)
  const { clearAndAdd } = useCart()

  const handleDifferentVendor = (item: MenuItem) => setConflictItem(item)

  const handleClearAndAdd = () => {
    if (!conflictItem) return
    clearAndAdd(conflictItem)
    setConflictItem(null)
  }

  const { q, category, school, campus, availableOnly, sortBy, vendorId } =
    searchParams
  const searchQuery = typeof q === "string" ? q : ""
  const categoryQuery = typeof category === "string" ? category : "all"
  const isAvailableOnly = availableOnly === "true"

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useMenuItems({
    q: searchQuery,
    category: categoryQuery,
    school: school || undefined,
    campus: campus || undefined,
    availableOnly: isAvailableOnly,
    sortBy: sortBy || undefined,
    vendorId: vendorId || undefined,
    limit,
    initialPage: initialPage + 1,
    enabled: true,
  })

  // Combine all pages of menus into a single array
  const items = data ? data.pages.flatMap((page) => page.items) : []

  return (
    <>
      {items.length > 0 && (
        <div className="mt-5">
          <MenuItemGrid
            items={items}
            onDifferentVendor={handleDifferentVendor}
            keyPrefix="more-"
          />
        </div>
      )}

      {(hasNextPage || isFetchingNextPage || status === "pending") && (
        <div className="mt-8">
          <InfiniteScrollTrigger
            hasNextPage={hasNextPage || status === "pending"}
            isFetchingNextPage={isFetchingNextPage || status === "pending"}
            fetchNextPage={fetchNextPage}
            skeletonVariant="menu-item-grid"
            skeletonCount={5}
            loadingText="Loading more items..."
            endText="You've reached the end of the menu items."
          />
        </div>
      )}

      {status === "error" && (
        <FetchError
          size="sm"
          title="Couldn't load more items"
          message={
            error?.message ||
            "Something went wrong while fetching the next batch of menu items."
          }
          onRetry={() => refetch()}
        />
      )}

      {/* Cross-vendor conflict dialog for newly loaded items */}
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
