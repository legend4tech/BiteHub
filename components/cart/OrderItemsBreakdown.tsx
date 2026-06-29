import { Receipt, StickyNote } from "lucide-react"
import { formatPrice, formatPriceExact } from "@/lib/format"
import { type Order } from "@/lib/types"

interface OrderItemsBreakdownProps {
  order: Order
}

export function OrderItemsBreakdown({ order }: OrderItemsBreakdownProps) {
  return (
    <div className="rounded-[28px] border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border/60 px-7 py-5 sm:px-8">
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
          <Receipt className="size-4 text-primary" />
        </div>
        <h2 className="font-heading text-base font-bold sm:text-lg">
          Your items
        </h2>
      </div>

      <div className="px-7 py-5 sm:px-8">
        <div className="space-y-3.5">
          {order.items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                {/* quantity pill */}
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground">
                  {item.quantity}
                </span>
                <span className="truncate text-sm font-medium">
                  {item.name}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Total breakdown */}
        <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
          {/* Items subtotal — sum from actual items, not derived from totalAmount */}
          <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
            <span>Items subtotal</span>
            <span className="tabular-nums">
              {formatPriceExact(
                order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
              )}
            </span>
          </div>

          {/* Delivery fee */}
          <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
            <span>Delivery Fee</span>
            <span className="tabular-nums">
              {(order.deliveryFee || 0) > 0
                ? formatPriceExact(order.deliveryFee)
                : "Free"}
            </span>
          </div>

          {/* Service / processing fee — shown separately so nothing is hidden */}
          {(order.serviceFee || 0) > 0 && (
            <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                Processing Fee
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                  Monnify
                </span>
              </span>
              <span className="tabular-nums">
                {formatPriceExact(order.serviceFee)}
              </span>
            </div>
          )}

          {/* Grand total */}
          <div className="mt-2 flex items-center justify-between rounded-2xl bg-primary/8 px-4 py-3.5">
            <span className="text-sm font-bold">Total Charged</span>
            <span className="text-lg font-extrabold text-primary tabular-nums">
              {formatPriceExact(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Note: </span>
              {order.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
