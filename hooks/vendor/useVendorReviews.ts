"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { VendorReview, RatingStatisticsData } from "@/types/vendor"

export function useVendorReviews(
  slug: string,
  rating: number | null = null,
  limit: number = 10
) {
  return useInfiniteQuery({
    queryKey: ["vendor-reviews", slug, rating],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get(`/vendors/${slug}/reviews`, {
        params: {
          page: pageParam,
          limit,
          ...(rating ? { rating } : {}),
        },
      })
      return {
        reviews: data.reviews as VendorReview[],
        page: data.page,
        hasMore: data.hasMore,
        statistics: data.statistics as RatingStatisticsData | undefined,
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    initialPageParam: 1,
  })
}
