"use client"

import type { Order } from "@/types/shared"
import {
  ORDER_STATUS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS,
} from "@/lib/constants"
import {
  AlertCircle,
  Check,
  Clock,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react"

interface OrderPaymentFlagProps {
  order: Order
  verifyingOrderId: string | null
  onVerifyPayment: (orderId: string) => void
}

/**
 * Payment flag shown in each vendor order card footer.
 * Wallet orders are created already paid (validated at checkout), so they only
 * need the "paid" badge. Monnify orders also handle pending/failed states.
 */
export function OrderPaymentFlag({
  order,
  verifyingOrderId,
  onVerifyPayment,
}: OrderPaymentFlagProps) {
  const { paymentMethod } = order
  if (paymentMethod !== "monnify" && paymentMethod !== "wallet") return null

  const isMonnify = paymentMethod === "monnify"
  const PaidIcon = isMonnify ? Check : Wallet
  const isVerifying = verifyingOrderId === order.orderId

  return (
    <>
      {order.paymentStatus === PAYMENT_STATUS.PAID && (
        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-info/10 py-2 text-sm font-semibold text-info">
          <PaidIcon className="size-4" /> Paid securely via{" "}
          {PAYMENT_METHOD_LABEL[paymentMethod]}
        </div>
      )}
      {isMonnify && (
        <>
          {order.paymentStatus === PAYMENT_STATUS.PENDING &&
            order.status !== ORDER_STATUS.CANCELLED && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-warning/10 py-2 text-sm font-semibold text-warning dark:text-warning">
                  <Clock className="size-4" /> Payment Pending
                </div>
                <button
                  onClick={() => onVerifyPayment(order.orderId)}
                  disabled={isVerifying}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition-all hover:border-primary/60 hover:bg-primary/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  {isVerifying ? "Verifying…" : "Verify Payment"}
                </button>
              </div>
            )}
          {order.paymentStatus === PAYMENT_STATUS.PENDING &&
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
    </>
  )
}
