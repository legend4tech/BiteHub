"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { MenuItem } from "@/lib/types"

interface UseMenuItemsOptions {
  q?: string
  category?: string
  school?: string
  campus?: string
  limit?: number
  initialPage?: number
  enabled?: boolean
  availableOnly?: boolean
  sortBy?: string
  vendorId?: string
}

export function useMenuItems(options?: UseMenuItemsOptions) {
  const {
    q = "",
    category = "all",
    school,
    campus,
    limit = 30,
    initialPage = 1,
    enabled = true,
    availableOnly,
    sortBy,
    vendorId,
  } = options || {}

  return useInfiniteQuery({
    queryKey: [
      "menus",
      q,
      category,
      school,
      campus,
      availableOnly,
      sortBy,
      vendorId,
    ],
    queryFn: async ({ pageParam = initialPage }) => {
      const { data } = await apiClient.get("/menus", {
        params: {
          page: pageParam,
          limit,
          q: q || undefined,
          category: category !== "all" ? category : undefined,
          school: school || undefined,
          campus: campus || undefined,
          availableOnly: availableOnly ? "true" : undefined,
          sortBy: sortBy !== "none" ? sortBy : undefined,
          vendorId: vendorId || undefined,
        },
      })
      return {
        items: data as MenuItem[],
        page: pageParam,
        hasMore: (data as MenuItem[]).length === limit,
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled,
    initialPageParam: initialPage,
  })
}
