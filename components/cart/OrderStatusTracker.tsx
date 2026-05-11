import { CheckCircle2, Circle, Clock } from "lucide-react"
import {
  ORDER_STATUS_STEPS,
  ORDER_STATUS_CONFIG,
  ORDER_STATUS,
} from "@/lib/constants"
import type { OrderStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface OrderStatusTrackerProps {
  status: OrderStatus
}

export function OrderStatusTracker({ status }: OrderStatusTrackerProps) {
  if (status === ORDER_STATUS.CANCELLED) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          Order Cancelled
        </p>
        <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/70">
          {ORDER_STATUS_CONFIG[ORDER_STATUS.CANCELLED].description}
        </p>
      </div>
    )
  }

  const currentIdx = ORDER_STATUS_STEPS.indexOf(status)

  return (
    <div className="py-2">
      <div className="flex items-start">
        {ORDER_STATUS_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isLast = idx === ORDER_STATUS_STEPS.length - 1

          return (
            <div
              key={step}
              className="relative flex flex-1 flex-col items-center"
            >
              {/* Connector line */}
              {!isLast && (
                <div className="absolute top-4 left-1/2 z-0 h-0.5 w-full">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      isDone ? "bg-primary" : "bg-border"
                    )}
                  />
                </div>
              )}

              {/* Icon */}
              <div className="relative z-10 mb-2">
                {isDone ? (
                  <CheckCircle2 className="size-8 fill-primary/15 text-primary" />
                ) : isCurrent ? (
                  <div className="flex size-8 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                    <Clock className="size-4 animate-pulse text-primary" />
                  </div>
                ) : (
                  <Circle className="size-8 text-border" />
                )}
              </div>

              {/* Label */}
              <p
                className={cn(
                  "px-1 text-center text-[10px] leading-tight font-medium",
                  isDone || isCurrent
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {ORDER_STATUS_CONFIG[step].label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Current status description */}
      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
        <p className="text-sm font-semibold text-primary">
          {ORDER_STATUS_CONFIG[status].label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {ORDER_STATUS_CONFIG[status].description}
        </p>
      </div>
    </div>
  )
}
