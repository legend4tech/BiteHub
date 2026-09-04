"use client"

import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { MenuItem } from "@/types/vendor"

export function useMenuItemDetail(itemId: string | undefined) {
  return useQuery({
    queryKey: ["menu-item", itemId],
    queryFn: async () => {
      if (!itemId) throw new Error("Item ID is required")
      const { data } = await apiClient.get(`/vendor/menu/${itemId}`)
      return data as MenuItem
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!itemId,
    retry: 1,
  })
}
