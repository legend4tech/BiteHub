import type { OrderRecord } from "@/types/customer"
import { formatPrice } from "@/lib/format"
import { formatDate, formatTime } from "@/lib/timeUtils"
import {
  Calendar,
  ChevronRight,
  MapPin,
  Receipt,
  ShoppingBag,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { OrderStatus } from "@/types/shared"

interface CustomerOrderCardProps {
  order: OrderRecord
}

export function CustomerOrderCard({ order }: CustomerOrderCardProps) {
  const formattedDate = `${formatDate(order.createdAt)}, ${formatTime(order.createdAt)}`

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      {/* Header: Vendor Info & Status Badge */}
      <div className="border-b border-border bg-muted/10 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-12">
              <ShoppingBag className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Ordered from
              </p>
              <h3 className="font-heading text-base font-bold break-words text-foreground sm:text-lg">
                {order.vendorName}
              </h3>
            </div>
          </div>

          <div className="shrink-0 pt-0.5">
            <StatusBadge
              status={order.status as OrderStatus}
              paymentStatus={order.paymentStatus}
            />
          </div>
        </div>

        {/* Metadata: Order ID & Date with wrap prevention */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="size-3.5 shrink-0" />
            <span>{formattedDate}</span>
          </span>
          <span className="hidden text-muted-foreground/40 sm:inline">•</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Receipt className="size-3.5 shrink-0 text-primary" />
            <Link
              href={`/order/${order.orderId}`}
              className="font-mono font-bold text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
            >
              #{order.orderId}
            </Link>
          </span>
        </div>
      </div>

      {/* Body: Items Summary */}
      <div className="p-4 sm:p-5">
        <h4 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Order Summary ({order.items.length}{" "}
          {order.items.length === 1 ? "item" : "items"})
        </h4>
        <div className="space-y-2.5">
          {order.items.map(
            (
              item: { name: string; quantity: number; priceInKobo: number },
              i: number
            ) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-muted/30 px-3.5 py-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2.5 pr-2">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {item.quantity}x
                  </span>
                  <span className="font-medium break-words text-foreground">
                    {item.name}
                  </span>
                </div>
                <span className="shrink-0 font-semibold text-foreground">
                  {formatPrice(item.priceInKobo * item.quantity)}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer: Location, Total, & Action Button */}
      <div className="border-t border-border bg-muted/5 p-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="break-words">{order.location}</span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-3 sm:justify-end sm:border-0 sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                Total Amount
              </p>
              <p className="font-heading text-lg font-bold text-primary sm:text-xl">
                {formatPrice(order.totalAmountInKobo)}
              </p>
            </div>

            <Button
              asChild
              size="sm"
              className="rounded-xl px-4 font-semibold shadow-sm transition-all"
            >
              <Link href={`/order/${order.orderId}`}>
                Track Order <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
