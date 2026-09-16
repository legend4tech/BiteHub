import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import axios from "axios"
import type {
  ForgotPasswordValues,
  ResetPasswordFormValues,
} from "@/lib/schemas"

export function useVendorAcceptTerms() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/vendor/accept-terms")
      return res.data
    },
  })
}

export function useVendorUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
    }: {
      orderId: string
      newStatus: string
    }) => {
      const res = await apiClient.patch(`/vendor/orders/${orderId}`, {
        status: newStatus,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] })
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] })
    },
  })
}

export function useVendorUpdateOrderPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      isPaid,
    }: {
      orderId: string
      isPaid: boolean
    }) => {
      const res = await apiClient.patch(`/vendor/orders/${orderId}/payment`, {
        isPaid,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] })
    },
  })
}

export function useVendorVerifyOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiClient.post(`/vendor/orders/${orderId}/verify`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] })
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] })
    },
  })
}

export function useVendorCreateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.post("/vendor/menu", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] })
    },
  })
}

export function useVendorUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await apiClient.patch(`/vendor/menu/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] })
    },
  })
}

export function useVendorDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/vendor/menu/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] })
    },
  })
}

export function useVendorUpdateMenuAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      isAvailable,
    }: {
      id: string
      isAvailable: boolean
    }) => {
      const res = await apiClient.patch(`/vendor/menu/${id}`, { isAvailable })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] })
    },
  })
}

export function useVendorUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.patch("/vendor/settings", data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-delivery-settings"] })
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] })
    },
  })
}

export function useVendorChangePassword() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await axios.post("/api/vendor/account/change-password", data)
      return res.data
    },
  })
}

export function useVendorForgotPassword() {
  return useMutation<unknown, Error, ForgotPasswordValues>({
    mutationFn: async (data) => {
      const res = await axios.post("/api/vendor/forgot-password", data)
      return res.data
    },
  })
}

export function useVendorResetPassword() {
  return useMutation<
    unknown,
    Error,
    Omit<ResetPasswordFormValues, "confirmPassword"> & {
      token: string
      email: string
    }
  >({
    mutationFn: async (data) => {
      const res = await axios.post("/api/vendor/reset-password", data)
      return res.data
    },
  })
}

export function useVendorChangeEmail() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await axios.post("/api/vendor/account/change-email", data)
      return res.data
    },
  })
}

export function useVendorAddMonnify() {
  return useMutation({
    mutationFn: async ({
      vendorId,
      data,
    }: {
      vendorId: string
      data: unknown
    }) => {
      const res = await apiClient.post(`/vendors/${vendorId}/monnify`, data)
      return res.data
    },
  })
}

export function useVendorRequestMonnifyChange() {
  return useMutation({
    mutationFn: async (vendorId: string) => {
      const res = await apiClient.post(
        `/vendors/${vendorId}/monnify/request-change`
      )
      return res.data
    },
  })
}

export function useVendorVerifyMonnifyChange() {
  return useMutation({
    mutationFn: async ({
      vendorId,
      data,
    }: {
      vendorId: string
      data: unknown
    }) => {
      const res = await apiClient.post(
        `/vendors/${vendorId}/monnify/verify-change`,
        data
      )
      return res.data
    },
  })
}
