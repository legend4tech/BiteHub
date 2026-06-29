/**
 * useVendorFilter.ts
 *
 * Infinite-scroll query hook for the vendor filter popover on /menus.
 * Fetches from GET /api/vendors/public — a lightweight endpoint that returns
 * only id, name, slug, and image (no aggregations).
 *
 * Used by: components/menus/VendorFilter.tsx
 */

"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { VendorFilterItem } from "@/lib/types"

interface UseVendorFilterOptions {
  school: string
  campus: string
  limit?: number
  /** Set to false to prevent fetching (e.g. while popover is closed) */
  enabled?: boolean
}

interface VendorFilterPage {
  items: VendorFilterItem[]
  hasMore: boolean
  page: number
}

/**
 * Paginated hook for loading vendors into the /menus filter popover.
 * Pages are loaded 20 at a time; call `fetchNextPage` when the sentinel
 * becomes visible to trigger the next load.
 */
export function useVendorFilter({
  school,
  campus,
  limit = 20,
  enabled = true,
}: UseVendorFilterOptions) {
  return useInfiniteQuery<VendorFilterPage>({
    queryKey: ["vendor-filter", school, campus],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get("/vendors/public", {
        params: {
          school: school || undefined,
          campus: campus || undefined,
          page: pageParam,
          limit,
        },
      })
      return {
        items: data.items as VendorFilterItem[],
        hasMore: data.hasMore as boolean,
        page: pageParam as number,
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes — vendor list changes infrequently
    gcTime: 1000 * 60 * 15,
    enabled,
    initialPageParam: 1,
  })
}
