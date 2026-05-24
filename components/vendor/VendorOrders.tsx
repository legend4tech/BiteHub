"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { OrderTable } from "@/components/vendor/OrderTable"
import type { Order, OrderStatus } from "@/lib/types"
import apiClient from "@/lib/axios"
import { toast } from "sonner"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"
import { ORDER_STATUS, ORDER_STATUS_CONFIG } from "@/lib/constants"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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
  counts: Record<string, number>
  activeStatus: string
  currentPage: number
  totalPages: number
  searchQuery?: string
}

export function VendorOrders({
  orders,
  counts,
  activeStatus,
  currentPage,
  totalPages,
  searchQuery = "",
}: VendorOrdersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    // Update the URL only if the debounced search is different from the initial searchQuery
    // to prevent unnecessary history pushes on initial load
    if (debouncedSearch !== searchQuery) {
      const params = new URLSearchParams(searchParams)
      if (debouncedSearch) {
        params.set("q", debouncedSearch)
      } else {
        params.delete("q")
      }
      params.delete("page") // Reset pagination when searching
      router.push(`?${params.toString()}`, { scroll: false })
    }
  }, [debouncedSearch, searchQuery, searchParams, router])

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      await apiClient.patch(`/vendor/orders/${orderId}`, { status: newStatus })
      toast.success("Order status updated")
      router.refresh() // Refresh the server component data
    } catch {
      toast.error("Couldn't update order status. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts["all"] || 0} total orders
          </p>
        </div>
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order ID or Name..."
            className="h-10 w-full rounded-full pl-9"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const count = counts[opt.value] || 0
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
                params.delete("page") // Reset to page 1 on status change
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

        {/* Pagination UI */}
        <div className="mt-6 border-t border-border pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={
                    currentPage > 1
                      ? `?status=${activeStatus}&page=${currentPage - 1}`
                      : "#"
                  }
                  className={
                    currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {/* Generate explicit page numbers if we have a small amount of pages, or ellipsize */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1
                // Simple display logic: show first, last, current, and adjacent
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href={`?status=${activeStatus}&page=${page}`}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }

                // Show ellipsis only once per gap
                if (page === 2 && currentPage > 3) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }
                if (page === totalPages - 1 && currentPage < totalPages - 2) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }

                return null
              })}

              <PaginationItem>
                <PaginationNext
                  href={
                    currentPage < totalPages
                      ? `?status=${activeStatus}&page=${currentPage + 1}`
                      : "#"
                  }
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
