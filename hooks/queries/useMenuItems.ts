"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { MenuItem } from "@/lib/types"

interface UseMenuItemsOptions {
  q?: string
  category?: string
  limit?: number
  initialPage?: number
  enabled?: boolean
}

export function useMenuItems(options?: UseMenuItemsOptions) {
  const {
    q = "",
    category = "all",
    limit = 10,
    initialPage = 1,
    enabled = true,
  } = options || {}

  return useInfiniteQuery({
    queryKey: ["menus", q, category],
    queryFn: async ({ pageParam = initialPage }) => {
      const { data } = await apiClient.get("/menus", {
        params: {
          page: pageParam,
          limit,
          q: q || undefined,
          category: category !== "all" ? category : undefined,
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
