 
import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export function useAdminUpdatePassword() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.post("/admin/settings/password", data)
      return res.data
    },
  })
}

export function useAdminUpdateGlobalSettings() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.patch("/admin/settings/global", data)
      return res.data
    },
  })
}

export function useAdminAddVendor() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.post("/admin/vendors", data)
      return res.data
    },
  })
}

export function useAdminAddLogin() {
  return useMutation({
    mutationFn: async ({
      vendorId,
      data,
    }: {
      vendorId: string
      data: unknown
    }) => {
      const res = await apiClient.post(
        `/admin/vendors/${vendorId}/account`,
        data
      )
      return res.data
    },
  })
}

export function useAdminToggleVendorActive() {
  return useMutation({
    mutationFn: async ({
      vendorId,
      isActive,
    }: {
      vendorId: string
      isActive: boolean
    }) => {
      const res = await apiClient.patch(`/admin/vendors/${vendorId}`, {
        isActive,
      })
      return res.data
    },
  })
}

export function useAdminToggleVendorFeatured() {
  return useMutation({
    mutationFn: async ({
      vendorId,
      isFeatured,
    }: {
      vendorId: string
      isFeatured: boolean
    }) => {
      const res = await apiClient.patch(`/admin/vendors/${vendorId}`, {
        isFeatured,
      })
      return res.data
    },
  })
}

export function useAdminVerifyOrder() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiClient.post(`/orders/${orderId}/verify`)
      return res.data
    },
  })
}
