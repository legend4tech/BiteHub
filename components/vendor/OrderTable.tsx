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
import { Copy, Check } from "lucide-react"

function CopyableText({ text, className, iconClassName }: { text: string; className?: string; iconClassName?: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className={`inline-flex items-center gap-1.5 ${className || ""}`}>
      <span>{text}</span>
      <button
        onClick={handleCopy}
        className={`text-muted-foreground/40 transition-all hover:text-primary active:scale-95 ${iconClassName || ""}`}
        title="Copy to clipboard"
      >
        {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

function OrderItemsDisplay({ items }: { items: Order["items"] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (items.length <= 2) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[150px]">
        {items.map((i, idx) => (
          <div key={idx} className="text-sm leading-tight">
            <span className="font-medium">{i.name}</span>
            <span className="text-muted-foreground ml-1.5 text-xs">×{i.quantity}</span>
          </div>
        ))}
      </div>
    )
  }

  const displayedItems = isExpanded ? items : items.slice(0, 1)

  return (
    <div className="flex flex-col gap-1.5 min-w-[150px]">
      {displayedItems.map((i, idx) => (
        <div key={idx} className="text-sm leading-tight">
          <span className="font-medium">{i.name}</span>
          <span className="text-muted-foreground ml-1.5 text-xs">×{i.quantity}</span>
        </div>
      ))}
      <button 
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
        className="text-xs text-primary font-medium text-left mt-0.5 hover:underline w-fit active:scale-95 transition-transform"
      >
        {isExpanded ? "Show less" : `+ ${items.length - 1} more items`}
      </button>
    </div>
  )
}

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
     
        title="No orders yet"
        description="Orders placed by students will appear here as they come in."
      />
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm md:text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-3 text-left text-sm font-semibold text-muted-foreground whitespace-nowrap">
                Order ID
              </th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-muted-foreground whitespace-nowrap">
                Customer
              </th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-muted-foreground">
                Items
              </th>
              <th className="px-3 py-3 text-right text-sm font-semibold text-muted-foreground whitespace-nowrap">
                Total
              </th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-muted-foreground whitespace-nowrap">
                Status
              </th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-muted-foreground whitespace-nowrap">
                Location
              </th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-muted-foreground whitespace-nowrap">
                Ordered Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr
                key={order.orderId}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-3 py-3 align-top">
                  <CopyableText 
                    text={order.orderId} 
                    className="font-mono text-sm font-semibold text-primary" 
                  />
                </td>
                <td className="px-3 py-3 align-top whitespace-nowrap">
                  <p className="font-medium text-sm">{order.customerName}</p>
                  <CopyableText 
                    text={order.customerPhone} 
                    className="text-xs text-muted-foreground mt-0.5" 
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <OrderItemsDisplay items={order.items} />
                </td>
                <td className="px-3 py-3 text-right font-bold align-top text-sm">
                  {formatPrice(order.totalAmount)}
                </td>
                <td className="px-3 py-3 align-top">
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
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm md:text-xs focus:border-primary focus:outline-none disabled:opacity-50"
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
                <td className="px-3 py-3 text-sm md:text-xs text-muted-foreground max-w-[150px] align-top" title={order.location}>
                  <div className="line-clamp-2">{order.location}</div>
                </td>
                <td className="px-3 py-3 text-sm md:text-xs whitespace-nowrap text-muted-foreground align-top">
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
