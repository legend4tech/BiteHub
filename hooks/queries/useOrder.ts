"use client"

import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { Order } from "@/lib/types"

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("Order ID is required")
      const { data } = await apiClient.get(`/orders?orderId=${orderId}`)
      return data as Order
    },
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 5,
    enabled: !!orderId,
    retry: (failureCount, error: unknown) => {
      const e = error as { response?: { status?: number } }
      if (e?.response?.status === 404) return false
      return failureCount < 2
    },
    refetchInterval: (query) => {
      const err = query.state.error as { response?: { status?: number } } | null
      if (err?.response?.status === 404) return false

      const order = query.state.data as Order | undefined
      // Stop polling for terminal states
      if (order?.status === "completed" || order?.status === "cancelled")
        return false
      // Poll aggressively while awaiting payment confirmation from Monnify webhook
      if (!order || order.paymentStatus === "pending") {
        // Stop polling if the order is older than 3 minutes to prevent infinite loops and memory leaks
        if (
          order &&
          new Date().getTime() - new Date(order.createdAt).getTime() >
            3 * 60 * 1000
        ) {
          return false
        }
        return 3000
      }
      // Slower polling once payment confirmed, still tracking prep/delivery status
      return 8000
    },
  })
}
