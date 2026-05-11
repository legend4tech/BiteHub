"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { OrderTable } from "@/components/vendor/OrderTable"
import type { Order, OrderStatus } from "@/lib/types"
import apiClient from "@/lib/axios"
import { toast } from "sonner"
import { ORDER_STATUS, ORDER_STATUS_CONFIG } from "@/lib/constants"

const FILTER_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  {
    value: ORDER_STATUS.PENDING,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.PENDING].label,
  },
  {
    value: ORDER_STATUS.CONFIRMED,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.CONFIRMED].label,
  },
  {
    value: ORDER_STATUS.PREPARING,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.PREPARING].label,
  },
  {
    value: ORDER_STATUS.READY,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.READY].label,
  },
  {
    value: ORDER_STATUS.COMPLETED,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.COMPLETED].label,
  },
  {
    value: ORDER_STATUS.CANCELLED,
    label: ORDER_STATUS_CONFIG[ORDER_STATUS.CANCELLED].label,
  },
]

interface VendorOrdersProps {
  orders: Order[]
  allOrders: Order[]
  activeStatus: string
}

export function VendorOrders({
  orders,
  allOrders,
  activeStatus,
}: VendorOrdersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      await apiClient.patch(`/vendor/orders/${orderId}`, { status: newStatus })
      toast.success("Order status updated")
      router.refresh() // Refresh the server component data
    } catch (error) {
      toast.error("Failed to update order status")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allOrders.length} total orders
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const count =
            opt.value === "all"
              ? allOrders.length
              : allOrders.filter((o) => o.status === opt.value).length
          return (
            <button
              key={opt.value}
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                if (opt.value === "all") {
                  params.delete("status")
                } else {
                  params.set("status", opt.value)
                }
                router.push(`?${params.toString()}`, { scroll: false })
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                activeStatus === opt.value
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-background text-muted-foreground hover:border-primary"
              }`}
            >
              {opt.label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <OrderTable orders={orders} onStatusChange={handleStatusChange} />
      </div>
    </div>
  )
}
