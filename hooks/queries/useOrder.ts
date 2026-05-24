"use client"

import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { OrderStatus } from "@/lib/types"

interface Order {
  orderId: string
  vendorId: string
  vendorName: string
  vendorWhatsappNumber: string
  customerName: string
  customerPhone: string
  location: string
  items: Array<{
    menuItemId: string
    name: string
    price: number
    quantity: number
  }>
  notes?: string
  totalAmount: number
  status: OrderStatus
  createdAt: string
  vendorPrepTime?: string | null
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("Order ID is required")
      const { data } = await apiClient.get(`/orders?orderId=${orderId}`)
      return data as Order
    },
    staleTime: 1000 * 30, // 30 seconds (orders change frequently)
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!orderId,
    retry: (failureCount, error: unknown) => {
      const e = error as { response?: { status?: number } }
      if (e?.response?.status === 404) return false
      return failureCount < 2
    },
    refetchInterval: (query) => {
      const err = query.state.error as { response?: { status?: number } } | null
      if (err?.response?.status === 404) return false

      const status = (query.state.data as Order | undefined)?.status
      if (status === "completed" || status === "cancelled") return false

      return 5000
    },
  })
}
