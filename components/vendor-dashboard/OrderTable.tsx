"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Order } from "@/types/shared"
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS,
  VALID_ORDER_STATUSES,
} from "@/lib/constants"
import type { OrderStatus } from "@/types/shared"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatPriceExact, formatTime } from "@/lib/format"
import {
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Receipt,
  User,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import { useVendorVerifyOrder } from "@/hooks/vendor/useVendorMutations"
import { toast } from "sonner"

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
          <Check className="size-3.5 text-success" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  )
}

function OrderItemsDisplay({ items }: { items: Order["items"] }) {
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

  const firstItems = items.slice(0, 2)
  const remainingItems = items.slice(2)

  return (
    <div className="flex min-w-[150px] flex-col gap-1.5">
      {firstItems.map((i, idx) => (
        <div key={idx} className="text-sm leading-tight">
          <span className="font-medium">{i.name}</span>
          <span className="ml-1.5 text-xs text-muted-foreground">
            ×{i.quantity}
          </span>
        </div>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 w-fit text-left text-xs font-medium text-primary underline underline-offset-2 transition-transform hover:opacity-80 active:scale-95"
          >
            + {remainingItems.length} more item
            {remainingItems.length > 1 ? "s" : ""}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="max-h-64 w-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <div className="flex flex-col gap-2">
            <p className="mb-1 border-b border-border/50 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              All Order Items
            </p>
            {items.map((i, idx) => (
              <div key={idx} className="text-sm leading-tight">
                <span className="font-medium">{i.name}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ×{i.quantity}
                </span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
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
  // Helper to fallback to manual calculation for orders created before schema update.
  // Uses exact decimals — no rounding — to match Monnify's actual deductions.
  const getEarnings = (order: Order) => {
    if (order.vendorRevenue && order.vendorRevenue > 0)
      return order.vendorRevenue
    // Legacy fallback: estimate from stored totals (no rounding on platform fee)
    const platformFee = order.totalAmount * 0.05
    return order.totalAmount - (order.serviceFee || 0) - platformFee
  }
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    orderId: string | null
    newStatus: OrderStatus | null
  }>({ isOpen: false, orderId: null, newStatus: null })
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null)

  const verifyPaymentMutation = useVendorVerifyOrder()

  const handleVerifyPayment = (orderId: string) => {
    setVerifyingOrderId(orderId)
    verifyPaymentMutation.mutate(orderId, {
      onSuccess: async (data) => {
        if (data.success) {
          toast.success(data.message || "Payment verified! Order confirmed.")
          if (onPaymentConfirm) await onPaymentConfirm(orderId)
        } else {
          toast.error(data.message || "Payment not confirmed yet.")
        }
      },
      onError: () => {
        toast.error("Failed to verify payment. Please try again.")
      },
      onSettled: () => {
        setVerifyingOrderId(null)
      },
    })
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
            className="flex transform-gpu flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
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
                  {formatPriceExact(getEarnings(order))}
                </span>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Earnings
                </p>
                {!onStatusChange && (
                  <div className="mt-1">
                    <StatusBadge
                      status={order.status}
                      paymentStatus={order.paymentStatus}
                    />
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
              {order.notes && (
                <div className="mt-1 flex items-start gap-2.5 border-t border-border/50 pt-2">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-warning" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold tracking-wider text-warning uppercase dark:text-warning">
                      Customer Note
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed font-medium text-foreground italic">
                      &ldquo;{order.notes}&rdquo;
                    </p>
                  </div>
                </div>
              )}
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
              {order.paymentMethod === "monnify" && (
                <>
                  {order.paymentStatus === "paid" && (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-info/10 py-2 text-sm font-semibold text-info">
                      <Check className="size-4" /> Paid securely via Monnify
                    </div>
                  )}
                  {order.paymentStatus === "pending" &&
                    order.status !== ORDER_STATUS.CANCELLED && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-warning/10 py-2 text-sm font-semibold text-warning dark:text-warning">
                          <Clock className="size-4" /> Payment Pending
                        </div>
                        <button
                          onClick={() => handleVerifyPayment(order.orderId)}
                          disabled={verifyingOrderId === order.orderId}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition-all hover:border-primary/60 hover:bg-primary/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {verifyingOrderId === order.orderId ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="size-4" />
                          )}
                          {verifyingOrderId === order.orderId
                            ? "Verifying…"
                            : "Verify Payment"}
                        </button>
                      </div>
                    )}
                  {order.paymentStatus === "pending" &&
                    order.status === ORDER_STATUS.CANCELLED && (
                      <div className="flex items-center justify-center gap-1.5 rounded-xl bg-muted/50 py-2 text-sm font-semibold text-muted-foreground">
                        <AlertCircle className="size-4" /> No Payment Made
                      </div>
                    )}
                  {order.paymentStatus === "failed" && (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-destructive/10 py-2 text-sm font-semibold text-destructive">
                      <AlertCircle className="size-4" /> Payment Failed
                    </div>
                  )}
                </>
              )}

              {/* Order Status Select */}
              {onStatusChange && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Update Status
                  </label>
                  {order.status === ORDER_STATUS.COMPLETED ? (
                    <div
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border-2 px-3 py-2.5 text-sm font-semibold",
                        ORDER_STATUS_CONFIG[order.status].className
                      )}
                    >
                      <span>Completed</span>
                      <CheckCircle2 className="size-4" />
                    </div>
                  ) : order.status === ORDER_STATUS.CANCELLED ? (
                    <div
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border-2 px-3 py-2.5 text-sm font-semibold",
                        ORDER_STATUS_CONFIG[order.status].className
                      )}
                    >
                      <span>Cancelled</span>
                      <XCircle className="size-4" />
                    </div>
                  ) : (
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
                      className={cn(
                        "w-full cursor-pointer rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all focus:outline-none disabled:opacity-50",
                        ORDER_STATUS_CONFIG[order.status].className,
                        "focus:ring-4",
                        // extract the text color class from the config and append it with /20 to make a soft focus ring
                        // (Tailwind handles this automatically if we rely on standard focus rings, but using the config class is enough)
                        "focus:border-primary/50"
                      )}
                    >
                      {ALL_STATUSES.map((s) => {
                        const isBackwards =
                          STATUS_LEVELS[s] < STATUS_LEVELS[order.status]
                        const isCancelled = s === ORDER_STATUS.CANCELLED

                        const isPendingPayment =
                          order.paymentStatus === "pending"
                        const isDisabled =
                          (isBackwards && !isCancelled) ||
                          (isPendingPayment && !isCancelled)

                        return (
                          <option
                            key={s}
                            value={s}
                            disabled={isDisabled}
                            className={cn(
                              "bg-background",
                              ORDER_STATUS_CONFIG[s].textColor
                            )}
                          >
                            {ORDER_STATUS_CONFIG[s].label}
                          </option>
                        )
                      })}
                    </select>
                  )}
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
