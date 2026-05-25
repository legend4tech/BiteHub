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
import {
  Loader2,
  Copy,
  Check,
  Banknote,
  Clock,
  MapPin,
  Receipt,
  User,
} from "lucide-react"

function CopyableText({
  text,
  className,
  iconClassName,
}: {
  text: string
  className?: string
  iconClassName?: string
}) {
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
        {copied ? (
          <Check className="size-3.5 text-green-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  )
}

function OrderItemsDisplay({ items }: { items: Order["items"] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (items.length <= 2) {
    return (
      <div className="flex min-w-[150px] flex-col gap-1.5">
        {items.map((i, idx) => (
          <div key={idx} className="text-sm leading-tight">
            <span className="font-medium">{i.name}</span>
            <span className="ml-1.5 text-xs text-muted-foreground">
              ×{i.quantity}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const displayedItems = isExpanded ? items : items.slice(0, 1)

  return (
    <div className="flex min-w-[150px] flex-col gap-1.5">
      {displayedItems.map((i, idx) => (
        <div key={idx} className="text-sm leading-tight">
          <span className="font-medium">{i.name}</span>
          <span className="ml-1.5 text-xs text-muted-foreground">
            ×{i.quantity}
          </span>
        </div>
      ))}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
        className="mt-0.5 w-fit text-left text-xs font-medium text-primary underline underline-offset-2 transition-transform hover:opacity-80 active:scale-95"
      >
        {isExpanded ? "Show less" : `+ ${items.length - 1} more items`}
      </button>
    </div>
  )
}

interface OrderTableProps {
  orders: Order[]
  onStatusChange?: (orderId: string, status: OrderStatus) => void
  onPaymentConfirm?: (orderId: string) => Promise<void> | void
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

export function OrderTable({
  orders,
  onStatusChange,
  onPaymentConfirm,
}: OrderTableProps) {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    orderId: string | null
    newStatus: OrderStatus | null
  }>({ isOpen: false, orderId: null, newStatus: null })

  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(
    null
  )

  const handlePaymentClick = async (orderId: string) => {
    if (!onPaymentConfirm) return
    setConfirmingPaymentId(orderId)
    try {
      await onPaymentConfirm(orderId)
    } finally {
      setConfirmingPaymentId(null)
    }
  }

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <div
            key={order.orderId}
            className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
          >
            {/* Header: Order ID & Date */}
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-border/50 pb-4">
              <div>
                <CopyableText
                  text={order.orderId}
                  className="font-mono text-sm font-bold text-primary"
                />
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>
                    {new Date(order.createdAt).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {formatTime(order.createdAt)}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-lg font-extrabold tracking-tight text-foreground">
                  {formatPrice(order.totalAmount)}
                </span>
                {!onStatusChange && (
                  <div className="mt-1">
                    <StatusBadge status={order.status} />
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-4 space-y-2.5 rounded-xl bg-muted/30 p-3">
              <div className="flex items-start gap-2.5">
                <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {order.customerName}
                  </p>
                  <CopyableText
                    text={order.customerPhone}
                    className="mt-0.5 text-xs text-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Delivery Location
                  </p>
                  <p
                    className="mt-0.5 line-clamp-2 text-xs leading-relaxed font-medium text-foreground"
                    title={order.location}
                  >
                    {order.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4 flex-1">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Receipt className="size-4 text-primary" />
                <span>Order Items</span>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <OrderItemsDisplay items={order.items} />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto space-y-3 border-t border-border/50 pt-4">
              {/* Payment Status Block */}
              {order.paymentMethod === "transfer" && (
                <div>
                  {order.paymentStatus === "transferred" ? (
                    <div className="flex flex-col gap-2 rounded-xl border border-status-pending/30 bg-status-pending/10 p-3">
                      <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-status-pending-foreground">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-pending opacity-75"></span>
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-pending"></span>
                        </span>
                        Payment Sent via Transfer
                      </p>
                      {onPaymentConfirm ? (
                        <button
                          onClick={() => handlePaymentClick(order.orderId)}
                          disabled={confirmingPaymentId === order.orderId}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-status-pending px-3 py-2 text-sm font-bold text-status-pending-foreground shadow-sm transition-colors hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                        >
                          {confirmingPaymentId === order.orderId ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            "Confirm Receipt"
                          )}
                        </button>
                      ) : (
                        <span className="text-center text-xs font-medium text-status-pending-foreground/80">
                          Awaiting your verification
                        </span>
                      )}
                    </div>
                  ) : order.paymentStatus === "confirmed" ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-status-completed/10 py-2 text-sm font-semibold text-status-completed">
                      <Check className="size-4" /> Paid via Transfer
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-muted py-2 text-sm text-muted-foreground">
                      Pending Transfer
                    </div>
                  )}
                </div>
              )}

              {order.paymentMethod === "cash" && (
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-muted py-2 text-sm font-semibold text-muted-foreground">
                  <Banknote className="size-4" /> Cash on Delivery
                </div>
              )}

              {/* Order Status Select */}
              {onStatusChange && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Update Status
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as OrderStatus
                      setConfirmState({
                        isOpen: true,
                        orderId: order.orderId,
                        newStatus,
                      })
                    }}
                    className="w-full cursor-pointer rounded-xl border-2 border-border bg-card px-3 py-2.5 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none disabled:opacity-50"
                    disabled={
                      order.status === ORDER_STATUS.CANCELLED ||
                      order.status === ORDER_STATUS.COMPLETED
                    }
                  >
                    {ALL_STATUSES.map((s) => {
                      const isBackwards =
                        STATUS_LEVELS[s] < STATUS_LEVELS[order.status]
                      const isCancelled = s === ORDER_STATUS.CANCELLED
                      const isDisabled = isBackwards && !isCancelled

                      return (
                        <option key={s} value={s} disabled={isDisabled}>
                          {ORDER_STATUS_CONFIG[s].label}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
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
