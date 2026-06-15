import { CheckCircle2, Circle, Clock } from "lucide-react"
import {
  ORDER_STATUS_STEPS,
  ORDER_STATUS_CONFIG,
  ORDER_STATUS,
} from "@/lib/constants"
import type { OrderStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusColorMap: Record<
  string,
  {
    text: string
    bg: string
    border: string
    box: string
    fill: string
    fg: string
  }
> = {
  pending: {
    text: "text-primary",
    bg: "bg-primary",
    border: "border-primary",
    box: "border-primary/20 bg-primary/10",
    fill: "fill-primary/15",
    fg: "text-primary",
  },
  confirmed: {
    text: "text-status-confirmed",
    bg: "bg-status-confirmed",
    border: "border-status-confirmed",
    box: "border-status-confirmed/20 bg-status-confirmed/10",
    fill: "fill-status-confirmed/15",
    fg: "text-status-confirmed-foreground",
  },
  preparing: {
    text: "text-status-preparing",
    bg: "bg-status-preparing",
    border: "border-status-preparing",
    box: "border-status-preparing/20 bg-status-preparing/10",
    fill: "fill-status-preparing/15",
    fg: "text-status-preparing-foreground",
  },
  ready: {
    text: "text-status-ready",
    bg: "bg-status-ready",
    border: "border-status-ready",
    box: "border-status-ready/20 bg-status-ready/10",
    fill: "fill-status-ready/15",
    fg: "text-status-ready-foreground",
  },
  completed: {
    text: "text-status-completed",
    bg: "bg-status-completed",
    border: "border-status-completed",
    box: "border-status-completed/20 bg-status-completed/10",
    fill: "fill-status-completed/15",
    fg: "text-status-completed-foreground",
  },
  cancelled: {
    text: "text-status-cancelled",
    bg: "bg-status-cancelled",
    border: "border-status-cancelled",
    box: "border-status-cancelled/20 bg-status-cancelled/10",
    fill: "fill-status-cancelled/15",
    fg: "text-status-cancelled-foreground",
  },
}

interface OrderStatusTrackerProps {
  status: OrderStatus
  paymentStatus?: string
}

export function OrderStatusTracker({
  status,
  paymentStatus,
}: OrderStatusTrackerProps) {
  if (status === ORDER_STATUS.CANCELLED) {
    const colors = statusColorMap[ORDER_STATUS.CANCELLED]
    return (
      <div className={cn("rounded-2xl border px-6 py-4", colors.box)}>
        <p className={cn("text-sm font-semibold", colors.fg)}>
          Order Cancelled
        </p>
        <p className={cn("mt-1 text-xs opacity-80", colors.fg)}>
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
          const colors = statusColorMap[step]

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
                      isDone ? colors.bg : "bg-border"
                    )}
                  />
                </div>
              )}

              {/* Icon */}
              <div className="relative z-10 mb-2 flex size-8 items-center justify-center rounded-full bg-card">
                {isDone ? (
                  <CheckCircle2
                    className={cn("size-8", colors.text, colors.fill)}
                  />
                ) : isCurrent ? (
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2 bg-current/10",
                      colors.border,
                      colors.text
                    )}
                  >
                    <Clock
                      className={cn("size-4 animate-pulse", colors.text)}
                    />
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
                {step === ORDER_STATUS.PENDING && paymentStatus === "pending"
                  ? "Awaiting Payment"
                  : ORDER_STATUS_CONFIG[step].label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Current status description */}
      <div
        className={cn(
          "mt-5 rounded-xl border px-4 py-3",
          statusColorMap[status].box
        )}
      >
        <p className={cn("text-sm font-semibold", statusColorMap[status].fg)}>
          {status === ORDER_STATUS.PENDING && paymentStatus === "pending"
            ? "Awaiting Payment"
            : ORDER_STATUS_CONFIG[status].label}
        </p>
        <p
          className={cn("mt-0.5 text-xs opacity-80", statusColorMap[status].fg)}
        >
          {status === ORDER_STATUS.PENDING && paymentStatus === "pending"
            ? "Please complete your payment to proceed"
            : ORDER_STATUS_CONFIG[status].description}
        </p>
      </div>
    </div>
  )
}
