import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

import { RewardCampaignFormValues } from "@/lib/schemas/admin"
import type { GamificationFailureItem } from "@/types/admin"

export function useCampaigns() {
  return useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/campaigns")
      return response.data.campaigns
    },
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: RewardCampaignFormValues) => {
      const response = await apiClient.post("/admin/campaigns", data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] })
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/campaigns/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<RewardCampaignFormValues>
    }) => {
      const response = await apiClient.put(`/admin/campaigns/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] })
    },
  })
}

export function useToggleCampaignStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/admin/campaigns/${id}/toggle`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] })
    },
  })
}

export function useGamificationAnalytics() {
  return useQuery({
    queryKey: ["admin-gamification-analytics"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/gamification/analytics")
      return response.data.data
    },
  })
}

export function useGamificationFailures(resolved?: boolean) {
  return useQuery<GamificationFailureItem[]>({
    queryKey: ["admin-gamification-failures", resolved],
    queryFn: async () => {
      const params = typeof resolved === "boolean" ? { resolved } : {}
      const response = await apiClient.get("/admin/gamification/failures", {
        params,
      })
      return response.data.failures
    },
  })
}

export function useRetryGamificationReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(
        `/admin/gamification/failures/${id}/retry`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-gamification-failures"],
      })
      queryClient.invalidateQueries({
        queryKey: ["admin-gamification-analytics"],
      })
    },
  })
}

export function useDismissGamificationFailure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(
        `/admin/gamification/failures/${id}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-gamification-failures"],
      })
    },
  })
}
