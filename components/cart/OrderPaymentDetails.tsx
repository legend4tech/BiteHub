"use client"

import { Landmark, CheckCircle2, Info, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Order } from "@/hooks/queries/useOrder"

interface OrderPaymentDetailsProps {
  order: Order
}

export function OrderPaymentDetails({ order }: OrderPaymentDetailsProps) {
  if (order.paymentMethod === "cash") {
    return (
      <div className="rounded-[28px] border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2.5 px-7 py-5 sm:px-8">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
            <Landmark className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold sm:text-lg">
              Cash on Delivery
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Please prepare exact change if possible.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (order.paymentMethod === "transfer") {
    return (
      <div className="rounded-[28px] border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border/60 px-7 py-5 sm:px-8">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
            <Landmark className="size-4 text-primary" />
          </div>
          <h2 className="font-heading text-base font-bold sm:text-lg">
            Payment Details
          </h2>
        </div>
        <div className="px-7 py-5 sm:px-8">
          {order.vendorPaymentDetails ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Bank Name</span>
                    <span className="font-semibold">
                      {order.vendorPaymentDetails.bankName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 py-2">
                    <span className="text-muted-foreground">
                      Account Number
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {order.vendorPaymentDetails.accountNumber || "N/A"}
                      </span>
                      {order.vendorPaymentDetails.accountNumber && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5 hover:bg-transparent"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              order.vendorPaymentDetails!.accountNumber
                            )
                            toast.success("Account number copied!")
                          }}
                        >
                          <Copy className="size-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-muted-foreground">Account Name</span>
                    <span className="font-semibold">
                      {order.vendorPaymentDetails.accountName || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`mt-5 flex flex-col items-center justify-center rounded-xl border p-4 text-center ${
                  order.paymentStatus === "confirmed"
                    ? "border-status-completed/20 bg-status-completed/10 text-status-completed"
                    : "border-primary/20 bg-primary/5 text-primary"
                }`}
              >
                {order.paymentStatus === "confirmed" ? (
                  <>
                    <CheckCircle2 className="mb-2 size-8 text-status-completed" />
                    <span className="font-heading text-base font-bold">
                      Payment Confirmed!
                    </span>
                    <span className="mt-1 text-sm">
                      The vendor has received your payment.
                    </span>
                  </>
                ) : (
                  <>
                    <div className="relative mb-3 flex size-8 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40"></span>
                      <span className="relative inline-flex size-6 rounded-full bg-primary"></span>
                    </div>
                    <span className="font-heading text-base font-bold">
                      Payment Sent
                    </span>
                    <span className="mt-1 text-sm text-foreground">
                      Waiting for the vendor to confirm receipt of your
                      transfer.
                    </span>
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2 text-left">
                      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        Please tap &quot;Contact vendor&quot; below to send your
                        payment receipt on WhatsApp.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              This vendor has not set up their bank details yet. Please contact
              them via WhatsApp to request payment details.
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
