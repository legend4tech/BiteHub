/**
 * usePromos.ts
 *
 * React Query hooks for admin promo code campaigns and redemptions.
 * Colocates queries and mutations for promo management with automated cache invalidation.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { PromoCode, PromoRedemptionDetail } from "@/types/promo"
import type { PromoCodeFormInput } from "@/lib/schemas"

export function usePromos() {
  return useQuery<PromoCode[]>({
    queryKey: ["admin-promos"],
    queryFn: async () => {
      const response = await apiClient.get<PromoCode[]>("/admin/promos")
      return response.data
    },
  })
}

export function usePromoRedemptions(promoCodeId?: string) {
  return useQuery<{
    redemptions: PromoRedemptionDetail[]
    total: number
    page: number
    totalPages: number
  }>({
    queryKey: ["admin-promo-redemptions", promoCodeId],
    queryFn: async () => {
      const url = promoCodeId
        ? `/admin/promos/redemptions?promoCodeId=${encodeURIComponent(promoCodeId)}`
        : "/admin/promos/redemptions"
      const response = await apiClient.get(url)
      return response.data
    },
  })
}

export function useCreatePromo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: PromoCodeFormInput) => {
      const response = await apiClient.post("/admin/promos", data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] })
    },
  })
}

export function useTogglePromoStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiClient.patch(`/admin/promos/${id}`, {
        isActive,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] })
    },
  })
}

export function usePromo(id?: string) {
  return useQuery<PromoCode>({
    queryKey: ["admin-promo", id],
    queryFn: async () => {
      const response = await apiClient.get<PromoCode>(`/admin/promos/${id}`)
      return response.data
    },
    enabled: Boolean(id),
  })
}

export function useDeletePromo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/promos/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] })
    },
  })
}

export function useUpdatePromo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<PromoCodeFormInput>
    }) => {
      const response = await apiClient.patch(`/admin/promos/${id}`, data)
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-promos"] })
      queryClient.invalidateQueries({ queryKey: ["admin-promo", variables.id] })
    },
  })
}
