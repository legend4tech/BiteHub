 
import { useMutation, useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import axios from "axios"

export function useContactSubmit() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await axios.post("/api/contact", data)
      return res.data
    },
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiClient.post("/orders", data)
      return res.data
    },
  })
}

export function usePayOrder() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiClient.post(`/orders/${orderId}/pay`)
      return res.data
    },
  })
}

export function useVerifyOrderPayment() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiClient.post(`/orders/${orderId}/verify`)
      return res.data
    },
  })
}

export function useConfirmEmail() {
  return useMutation({
    mutationFn: async ({ token, email }: { token: string; email: string }) => {
      const res = await axios.get(
        `/api/vendor/account/confirm-email?token=${token}&email=${encodeURIComponent(email)}`
      )
      return res.data
    },
  })
}

export function useBanksQuery() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const res = await axios.get("/api/banks")
      return res.data?.data || []
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}
