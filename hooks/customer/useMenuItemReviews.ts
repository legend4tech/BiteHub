"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { RatingStatisticsData } from "@/types/vendor"

export interface MenuItemReview {
  id: string
  rating: number
  title?: string
  comments?: string
  isAnonymous: boolean
  createdAt: string
  customerName?: string
  customerImage?: string
}

export function useMenuItemReviews(
  menuItemId: string,
  rating: number | null = null,
  limit: number = 10
) {
  return useInfiniteQuery({
    queryKey: ["menu-item-reviews", menuItemId, rating],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get(`/menus/${menuItemId}/reviews`, {
        params: {
          page: pageParam,
          limit,
          ...(rating ? { rating } : {}),
        },
      })
      return {
        reviews: data.reviews as MenuItemReview[],
        page: data.page,
        hasMore: data.hasMore,
        statistics: data.statistics as RatingStatisticsData | undefined,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  })
}
