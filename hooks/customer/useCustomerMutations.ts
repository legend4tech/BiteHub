import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { CustomerProfile } from "@/types/customer"
import type {
  ChangePasswordValues,
  ChangeEmailValues,
  ForgotPasswordValues,
  ResetPasswordFormValues,
} from "@/lib/schemas"

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<CustomerProfile>) => {
      const res = await apiClient.patch("/customer/me", data)
      return res.data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["customer-profile"] })
    },
  })
}

export function useCustomerChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordValues) => {
      const res = await apiClient.post(
        "/customer/account/change-password",
        data
      )
      return res.data
    },
  })
}

export function useCustomerChangeEmail() {
  return useMutation({
    mutationFn: async (data: ChangeEmailValues) => {
      const res = await apiClient.post("/customer/account/change-email", data)
      return res.data
    },
  })
}

export function useCustomerForgotPassword() {
  return useMutation<unknown, Error, ForgotPasswordValues>({
    mutationFn: async (data) => {
      const res = await apiClient.post("/customer/forgot-password", data)
      return res.data
    },
  })
}

export function useCustomerResetPassword() {
  return useMutation<
    unknown,
    Error,
    Omit<ResetPasswordFormValues, "confirmPassword"> & {
      token: string
      email: string
    }
  >({
    mutationFn: async (data) => {
      const res = await apiClient.post("/customer/reset-password", data)
      return res.data
    },
  })
}
