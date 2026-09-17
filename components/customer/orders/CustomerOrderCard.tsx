import type { OrderRecord } from "@/types/customer"
import { formatPrice } from "@/lib/format"
import { Calendar, MapPin, Receipt, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { OrderStatus } from "@/types/shared"

interface CustomerOrderCardProps {
  order: OrderRecord
}

export function CustomerOrderCard({ order }: CustomerOrderCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col border-b border-border bg-muted/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <ShoppingBag className="size-6 text-primary" />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold text-foreground">
              <span className="font-normal text-muted-foreground">
                Ordered from:
              </span>{" "}
              {order.vendorName}
            </p>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Receipt className="size-3.5" />{" "}
                <Link
                  href={`/order/${order.orderId}`}
                  target="_blank"
                  className="font-mono text-foreground transition-colors hover:text-primary hover:underline"
                >
                  {order.orderId}
                </Link>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {new Date(order.createdAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 sm:mt-0 sm:flex-col sm:items-end">
          <p className="font-heading text-xl font-bold text-primary">
            {formatPrice(order.totalAmount)}
          </p>
          <StatusBadge
            status={order.status as OrderStatus}
            paymentStatus={order.paymentStatus}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h4 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Order Summary
        </h4>
        <div className="space-y-3">
          {order.items.map(
            (
              item: { name: string; quantity: number; price: number },
              i: number
            ) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm"
              >
                <span className="font-medium text-foreground">
                  <span className="mr-2 inline-flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {item.quantity}x
                  </span>
                  {item.name}
                </span>
                <span className="font-semibold text-foreground">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-muted/5 p-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span className="truncate">{order.location}</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {order.items.length} {order.items.length === 1 ? "item" : "items"}{" "}
            total
          </span>
        </div>
      </div>
    </div>
  )
}
