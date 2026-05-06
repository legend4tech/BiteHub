"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MenuItemCard } from "@/components/menus/MenuItemCard";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { FetchError } from "@/components/shared/FetchError";
import type { MenuItem } from "@/lib/types";
import apiClient from "@/lib/axios";
import { useCart } from "@/hooks/useCart";
import { FadeIn } from "@/components/FadeIn";

interface LoadMoreMenusProps {
  initialPage: number;
  searchParams: { [key: string]: string | undefined };
}

export function LoadMoreMenus({ initialPage, searchParams }: LoadMoreMenusProps) {
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null);
  const { clearAndAdd } = useCart();
  const { ref, inView } = useInView();

  const handleDifferentVendor = (item: MenuItem) => setConflictItem(item);

  const handleClearAndAdd = () => {
    if (!conflictItem) return;
    clearAndAdd(conflictItem);
    setConflictItem(null);
  };

  const q = searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : "";
  const category = searchParams.category && searchParams.category !== "all" 
    ? `&category=${encodeURIComponent(searchParams.category)}` 
    : "";

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["menus", searchParams.q || "", searchParams.category || "all"],
    initialPageParam: initialPage + 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`/menus?page=${pageParam}${q}${category}`);
      return response.data as MenuItem[];
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.length === 0) return undefined;
      return lastPageParam + 1;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Combine all pages of menus into a single array
  const items = data ? data.pages.flat() : [];

  return (
    <>
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-5">
          {items.map((item, i) => (
            <FadeIn key={`${item.id}-${i}`} delay={0.05 * Math.min(i, 20)}>
              <MenuItemCard item={item} onDifferentVendor={handleDifferentVendor} />
            </FadeIn>
          ))}
        </div>
      )}

      {(hasNextPage || isFetchingNextPage) && (
        <div ref={ref} className="mt-8">
          <PageSkeleton variant="menu-item-grid" count={5} />
        </div>
      )}

      {status === "error" && (
        <FetchError
          size="sm"
          title="Couldn't load more items"
          message={error?.message || "Something went wrong while fetching the next batch of menu items."}
          onRetry={() => fetchNextPage()}
        />
      )}

      {/* Cross-vendor conflict dialog for newly loaded items */}
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
