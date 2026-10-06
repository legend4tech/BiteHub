"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useAdminOrders } from "@/hooks/admin/useAdminOrders"
import {
  ShoppingCart,
  Copy,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { PAYMENT_METHOD_LABEL } from "@/lib/constants"
import Link from "next/link"
import { formatPrice } from "@/lib/format"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { OrderStatus } from "@/types/shared"
export function AdminOrders() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const [page, setPage] = useState(1)
  const limit = 20
  const excludeStatus = role === "vendor_manager" ? "completed" : undefined
  const { data, isLoading, isError, refetch } = useAdminOrders(
    page,
    limit,
    excludeStatus
  )
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View all orders across the platform and access contact details
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm font-semibold">
            {data?.pagination.total ?? 0} total orders
          </p>
        </div>
        {isError ? (
          <FetchError
            message="Failed to load orders."
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <PageSkeleton variant="admin-orders" count={5} />
        ) : data?.orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Orders placed by customers will appear here."
            icon={<ShoppingCart className="text-muted-foreground" />}
          />
        ) : (
          <>
            <div className="divide-y divide-border">
              {data?.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-muted/30 md:flex-row md:items-start md:justify-between"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/order/${order.orderId}`}
                        className="font-mono text-sm font-bold text-foreground transition-colors hover:text-primary hover:underline"
                        target="_blank"
                      >
                        {order.orderId}
                      </Link>
                      <StatusBadge
                        status={order.status as OrderStatus}
                        paymentStatus={order.paymentStatus}
                      />
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {order.paymentStatus === "paid"
                          ? `Paid via ${PAYMENT_METHOD_LABEL[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABEL] ?? order.paymentMethod}`
                          : `Payment ${order.paymentStatus}`}
                      </span>
                      <p className="ml-auto text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("en-NG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1 rounded-xl border border-border/50 bg-background/50 p-3">
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Customer
                        </p>
                        <p className="text-sm font-medium">
                          {order.customerName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{order.customerPhone}</span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                order.customerPhone,
                                "Customer phone"
                              )
                            }
                            className="hover:text-primary"
                            title="Copy Phone"
                          >
                            <Copy className="size-3" />
                          </button>
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="hover:text-primary"
                            title="Call Customer"
                          >
                            <PhoneCall className="size-3" />
                          </a>
                        </div>
                      </div>
                      <div className="space-y-1 rounded-xl border border-border/50 bg-background/50 p-3">
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Vendor
                        </p>
                        <p className="text-sm font-medium">
                          {order.vendorName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{order.vendorWhatsappNumber}</span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                order.vendorWhatsappNumber,
                                "Vendor WhatsApp"
                              )
                            }
                            className="hover:text-primary"
                            title="Copy WhatsApp"
                          >
                            <Copy className="size-3" />
                          </button>
                          <a
                            href={`https://wa.me/${order.vendorWhatsappNumber.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                            title="WhatsApp Vendor"
                          >
                            <PhoneCall className="size-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <p>
                        <span className="font-semibold text-foreground">
                          {order.items.length} items
                        </span>{" "}
                        — {order.items.map((i) => i.name).join(", ")}
                      </p>
                      <p className="ml-auto font-bold text-foreground">
                        {formatPrice(order.totalAmountInKobo)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination Controls */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.pagination.page === 1 || isLoading}
                  >
                    <ChevronLeft className="mr-1 size-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(data.pagination.totalPages, p + 1)
                      )
                    }
                    disabled={!data.pagination.hasMore || isLoading}
                  >
                    Next <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
