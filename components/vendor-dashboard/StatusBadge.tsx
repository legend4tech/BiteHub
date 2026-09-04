import { cn } from "@/lib/utils"
import { ORDER_STATUS_CONFIG } from "@/lib/constants"
import type { OrderStatus } from "@/types/shared"

interface StatusBadgeProps {
  status: OrderStatus
  paymentStatus?: string
  className?: string
}

export function StatusBadge({
  status,
  paymentStatus,
  className,
}: StatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {status === "pending" && paymentStatus === "pending"
        ? "Awaiting Payment"
        : config.label}
    </span>
  )
}
