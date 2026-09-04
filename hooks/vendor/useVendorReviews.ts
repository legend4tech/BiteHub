"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface VendorReview {
  id: string
  rating: number
  comments?: string
  createdAt: string
  isAnonymous: boolean
  customerName: string
}

export interface RatingStatisticsData {
  averageRating: number
  totalReviews: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

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
