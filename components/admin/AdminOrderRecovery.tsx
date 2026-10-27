"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAdminVerifyOrder } from "@/hooks/admin/useAdminMutations"

export function AdminOrderRecovery() {
  const [orderIdToVerify, setOrderIdToVerify] = useState("")
  const verifyOrderMutation = useAdminVerifyOrder()

  const handleVerifyOrder = () => {
    if (!orderIdToVerify.trim()) return

    verifyOrderMutation.mutate(orderIdToVerify.trim(), {
      onSuccess: (data) => {
        toast.success(data?.message || "Order verified successfully")
        setOrderIdToVerify("")
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } }
        toast.error(err.response?.data?.error || "Verification failed")
      },
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-confirmed/10 text-status-confirmed-foreground">
          <Search className="size-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold">Order Recovery</h2>
          <p className="text-sm text-muted-foreground">
            Manually sync a stuck order with Monnify
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Order ID</label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. BH-XXXXXX-XXXX"
              value={orderIdToVerify}
              onChange={(e) => setOrderIdToVerify(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={handleVerifyOrder}
              disabled={
                !orderIdToVerify.trim() || verifyOrderMutation.isPending
              }
            >
              {verifyOrderMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            If a vendor reports a successful payment is showing as pending,
            paste the Order ID here to forcefully sync the status from Monnify.
          </p>
        </div>
      </div>
    </div>
  )
}
