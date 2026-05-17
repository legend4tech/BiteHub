import { useState } from "react"
import type { Order } from "@/lib/types"
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS,
  VALID_ORDER_STATUSES,
} from "@/lib/constants"
import type { OrderStatus } from "@/lib/types"
import { StatusBadge } from "@/components/vendor/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { formatPrice, formatTime } from "@/lib/format"

interface OrderTableProps {
  orders: Order[]
  onStatusChange?: (orderId: string, status: OrderStatus) => void
}

const ALL_STATUSES: OrderStatus[] = Array.from(VALID_ORDER_STATUSES)

const STATUS_LEVELS: Record<OrderStatus, number> = {
  [ORDER_STATUS.PENDING]: 0,
  [ORDER_STATUS.CONFIRMED]: 1,
  [ORDER_STATUS.PREPARING]: 2,
  [ORDER_STATUS.READY]: 3,
  [ORDER_STATUS.COMPLETED]: 4,
  [ORDER_STATUS.CANCELLED]: 5,
}

export function OrderTable({ orders, onStatusChange }: OrderTableProps) {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    orderId: string | null
    newStatus: OrderStatus | null
  }>({ isOpen: false, orderId: null, newStatus: null })

  if (orders.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon="📋"
        showImage={false}
        title="No orders yet"
        description="Orders placed by students will appear here as they come in."
      />
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                Order ID
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                Customer
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                Items
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                Total
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                Location
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                Date&Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr
                key={order.orderId}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-3 py-3">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {order.orderId}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customerPhone}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <p className="text-xs text-muted-foreground">
                    {order.items
                      .map((i) => `${i.name} ×${i.quantity}`)
                      .join(", ")}
                  </p>
                </td>
                <td className="px-3 py-3 text-right font-bold">
                  {formatPrice(order.totalAmount)}
                </td>
                <td className="px-3 py-3">
                  {onStatusChange ? (
                    <select
                      value={order.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as OrderStatus
                        setConfirmState({
                          isOpen: true,
                          orderId: order.orderId,
                          newStatus,
                        })
                        // the visual revert will happen automatically because value={order.status}
                      }}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none disabled:opacity-50"
                      disabled={
                        order.status === ORDER_STATUS.CANCELLED ||
                        order.status === ORDER_STATUS.COMPLETED
                      }
                    >
                      {ALL_STATUSES.map((s) => {
                        // Prevent moving backwards in the flow, except for cancelling
                        const isBackwards =
                          STATUS_LEVELS[s] < STATUS_LEVELS[order.status]
                        const isCancelled = s === ORDER_STATUS.CANCELLED
                        // If the order is already cancelled/completed, we disable the select entirely above.
                        const isDisabled = isBackwards && !isCancelled

                        return (
                          <option key={s} value={s} disabled={isDisabled}>
                            {ORDER_STATUS_CONFIG[s].label}
                          </option>
                        )
                      })}
                    </select>
                  ) : (
                    <StatusBadge status={order.status} />
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground max-w-[150px] truncate" title={order.location}>
                  {order.location}
                </td>
                <td className="px-3 py-3 text-xs whitespace-nowrap text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  {formatTime(order.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onStatusChange && (
        <ConfirmDialog
          open={confirmState.isOpen}
          onOpenChange={(isOpen) => setConfirmState((s) => ({ ...s, isOpen }))}
          title="Update Order Status"
          description={
            confirmState.newStatus
              ? `Are you sure you want to mark this order as ${ORDER_STATUS_CONFIG[confirmState.newStatus].label}?`
              : "Are you sure you want to update this order's status?"
          }
          confirmText="Yes, update status"
          onConfirm={() => {
            if (confirmState.orderId && confirmState.newStatus) {
              onStatusChange(confirmState.orderId, confirmState.newStatus)
            }
          }}
        />
      )}
    </>
  )
}
