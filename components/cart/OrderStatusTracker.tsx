import { CheckCircle2, Circle, Clock } from "lucide-react";
import { ORDER_STATUS_STEPS, ORDER_STATUS_CONFIG } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrderStatusTrackerProps {
  status: OrderStatus;
}

export function OrderStatusTracker({ status }: OrderStatusTrackerProps) {
  if (status === "cancelled") {
    return (
      <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-6 py-4">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
        <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1">
          {ORDER_STATUS_CONFIG.cancelled.description}
        </p>
      </div>
    );
  }

  const currentIdx = ORDER_STATUS_STEPS.indexOf(status);

  return (
    <div className="py-2">
      <div className="flex items-start">
        {ORDER_STATUS_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isLast = idx === ORDER_STATUS_STEPS.length - 1;

          return (
            <div key={step} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 z-0">
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
                  <CheckCircle2 className="size-8 text-primary fill-primary/15" />
                ) : isCurrent ? (
                  <div className="size-8 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                    <Clock className="size-4 text-primary animate-pulse" />
                  </div>
                ) : (
                  <Circle className="size-8 text-border" />
                )}
              </div>

              {/* Label */}
              <p
                className={cn(
                  "text-center text-[10px] font-medium leading-tight px-1",
                  isDone || isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {ORDER_STATUS_CONFIG[step].label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Current status description */}
      <div className="mt-5 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
        <p className="text-sm font-semibold text-primary">
          {ORDER_STATUS_CONFIG[status].label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {ORDER_STATUS_CONFIG[status].description}
        </p>
      </div>
    </div>
  );
}
