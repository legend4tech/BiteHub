"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { Vendor } from "@/types/vendor"
import type { VendorWithMenu } from "@/types/vendor"

interface UseVendorsOptions {
  q?: string
  school?: string
  campus?: string
  limit?: number
  initialPage?: number
  enabled?: boolean
}

export function useVendors(options?: UseVendorsOptions) {
  const {
    q = "",
    school,
    campus,
    limit = 12,
    initialPage = 1,
    enabled = true,
  } = options || {}

  return useInfiniteQuery({
    queryKey: ["vendors", q, school, campus],
    queryFn: async ({ pageParam = initialPage }) => {
      const { data } = await apiClient.get("/vendors", {
        params: {
          page: pageParam,
          limit,
          q: q || undefined,
          school: school || undefined,
          campus: campus || undefined,
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
