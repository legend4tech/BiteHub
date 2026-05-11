"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { Vendor } from "@/lib/types"

interface UseVendorsOptions {
  q?: string
  limit?: number
  initialPage?: number
  enabled?: boolean
}

export interface VendorWithMenu extends Vendor {
  itemCount?: number
  avgRating?: number
}

export function useVendors(options?: UseVendorsOptions) {
  const { q = "", limit = 12, initialPage = 1, enabled = true } = options || {}

  return useInfiniteQuery({
    queryKey: ["vendors", q],
    queryFn: async ({ pageParam = initialPage }) => {
      const { data } = await apiClient.get("/vendors", {
        params: {
          page: pageParam,
          limit,
          q: q || undefined,
        },
      })
      return {
        vendors: data as VendorWithMenu[],
        page: pageParam,
        hasMore: (data as VendorWithMenu[]).length === limit,
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    enabled,
    initialPageParam: initialPage,
  })
}
