import { Copy, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatTime } from "@/lib/format"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { type Order } from "@/types/shared"

interface OrderHeroCardProps {
  order: Order
}

export function OrderHeroCard({ order }: OrderHeroCardProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      {/* Coloured top strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

      <div className="p-7 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Label */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-widest text-primary uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                Order placed
              </span>
            </div>

            {/* Order ID */}
            <div className="mt-3 flex items-center gap-2">
              <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                {order.orderId}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {
                  navigator.clipboard.writeText(order.orderId)
                  toast.success("Order ID copied!")
                }}
              >
                <Copy className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
                <span className="sr-only">Copy Order ID</span>
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Copy this ID to track your order later on the &ldquo;Track
              Order&rdquo; page.
            </p>

            {/* Meta */}
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>
                from{" "}
                <span className="font-semibold text-foreground">
                  {order.vendorName}
                </span>
              </span>
              <span className="text-border">·</span>
              <span>
                {new Date(order.createdAt).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                at {formatTime(order.createdAt)}
              </span>
              <span className="text-border">·</span>
              <span>
                For:{" "}
                <span className="font-semibold text-foreground">
                  {order.customerName}
                </span>
              </span>
              <span className="text-border">·</span>
              <span>
                Deliver to:{" "}
                <span className="font-semibold text-foreground">
                  {order.location}
                </span>
              </span>
            </p>
          </div>

          {/* Icon bubble */}
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <ShoppingBag className="size-6 text-primary" />
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-5 border-t border-border/60 pt-5">
          <StatusBadge
            status={order.status}
            paymentStatus={order.paymentStatus}
          />
        </div>
      </div>
    </div>
  )
}
