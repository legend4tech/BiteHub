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

export function useAdminUpdateProfile() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.patch("/admin/settings/profile", data)
      return res.data
    },
  })
}

export function useAdminUpdateGlobalSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.patch("/admin/settings/global", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-settings"] })
    },
  })
}

export function useAdminAddVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.post("/admin/vendors", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
    },
  })
}

export function useAdminAddLogin() {
  const queryClient = useQueryClient()
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
    },
  })
}

export function useAdminToggleVendorActive() {
  const queryClient = useQueryClient()
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
    },
  })
}

export function useAdminToggleVendorFeatured() {
  const queryClient = useQueryClient()
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
    },
  })
}

export function useAdminToggleVendorManaged() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      vendorId,
      isManagedByBiteHub,
    }: {
      vendorId: string
      isManagedByBiteHub: boolean
    }) => {
      const res = await apiClient.patch(`/admin/vendors/${vendorId}`, {
        isManagedByBiteHub,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
    },
  })
}

export function useAdminVerifyOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiClient.post(`/orders/${orderId}/verify`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
    },
  })
}

export function useAdminCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.post("/admin/staff", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
    },
  })
}

export function useAdminLogWithdrawal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      amount: number
      reference: string
      note?: string
    }) => {
      const res = await apiClient.post("/api/admin/withdrawals", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
    },
  })
}
