"use client"

import { useState } from "react"
import {
  useGamificationFailures,
  useRetryGamificationReward,
  useDismissGamificationFailure,
} from "@/hooks/admin/useCampaigns"
import type { GamificationFailureItem } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Eye,
  Gift,
  Coins,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"
import Link from "next/link"

export function RewardFailureLogsTable() {
  const [filterResolved, setFilterResolved] = useState<boolean | undefined>(
    false
  )
  const {
    data: failures,
    isLoading,
    isError,
    refetch,
  } = useGamificationFailures(filterResolved)

  const { mutateAsync: retryReward, isPending: isRetrying } =
    useRetryGamificationReward()
  const { mutateAsync: dismissFailure, isPending: isDismissing } =
    useDismissGamificationFailure()

  // Modal states
  const [selectedForRetry, setSelectedForRetry] =
    useState<GamificationFailureItem | null>(null)
  const [selectedForDismiss, setSelectedForDismiss] =
    useState<GamificationFailureItem | null>(null)
  const [viewingStackLog, setViewingStackLog] =
    useState<GamificationFailureItem | null>(null)

  const handleConfirmRetry = async () => {
    if (!selectedForRetry) return
    try {
      await retryReward(selectedForRetry.id)
      toast.success(
        `Reward successfully credited to ${selectedForRetry.customer?.name || "customer"}`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry reward")
    } finally {
      setSelectedForRetry(null)
    }
  }

  const handleConfirmDismiss = async () => {
    if (!selectedForDismiss) return
    try {
      await dismissFailure(selectedForDismiss.id)
      toast.success("Issue marked as resolved/dismissed")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to dismiss issue"
      )
    } finally {
      setSelectedForDismiss(null)
    }
  }

  if (isLoading) {
    return <PageSkeleton variant="admin-list" />
  }

  if (isError) {
    return (
      <FetchError
        onRetry={refetch}
        message="Failed to load gamification failure logs. Please check your network connection."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={filterResolved === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterResolved(false)}
            className="rounded-full"
          >
            Unresolved Only
          </Button>
          <Button
            variant={filterResolved === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterResolved(undefined)}
            className="rounded-full"
          >
            All Logs
          </Button>
          <Button
            variant={filterResolved === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterResolved(true)}
            className="rounded-full"
          >
            Resolved Only
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {failures?.length || 0} issue
          {failures?.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Empty State */}
      {!failures || failures.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="size-10 text-emerald-500" />}
          title="All Clear!"
          description={
            filterResolved === false
              ? "No unresolved reward failure logs found. All customer rewards are running smoothly."
              : "No gamification failure logs found."
          }
        />
      ) : (
        /* Table */
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Context & Order</th>
                  <th className="px-6 py-4">Campaign & Reward</th>
                  <th className="px-6 py-4">Error Summary</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {failures.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-muted/20"
                  >
                    {/* Customer */}
                    <td className="px-6 py-4 font-medium">
                      {log.customer ? (
                        <div>
                          <p className="font-semibold text-foreground">
                            {log.customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.customer.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.customer.phone}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Unknown Customer
                        </span>
                      )}
                    </td>

                    {/* Context & Order */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {log.context || "General"}
                        </Badge>
                        {log.orderId && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Link
                              href={`/admin/orders?search=${log.orderId}`}
                              className="inline-flex items-center gap-1 font-mono hover:underline"
                            >
                              <span>{log.orderId}</span>
                              <ExternalLink className="size-3" />
                            </Link>
                          </div>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </td>

                    {/* Campaign & Reward */}
                    <td className="px-6 py-4">
                      {log.campaign ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">
                            {log.campaign.title}
                          </p>
                          {log.campaign.rewardType === "BITEHUB_COINS" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                              <Coins className="size-3" />
                              {formatPrice(
                                log.campaign.rewardValueInKobo || 0
                              )}{" "}
                              BHC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <Gift className="size-3" />
                              Free Meal
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Unknown Campaign
                        </span>
                      )}
                    </td>

                    {/* Error Summary */}
                    <td className="max-w-[240px] px-6 py-4">
                      <div className="space-y-1">
                        <p
                          className="line-clamp-2 text-xs font-medium text-rose-600 dark:text-rose-400"
                          title={log.errorMessage}
                        >
                          {log.errorMessage}
                        </p>
                        {log.errorStack && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                            onClick={() => setViewingStackLog(log)}
                          >
                            <Eye className="mr-1 size-3" />
                            View Stack Trace
                          </Button>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {log.resolved ? (
                        <Badge
                          variant="secondary"
                          className="border-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        >
                          Resolved
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="animate-pulse border-none bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        >
                          Unresolved
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {!log.resolved && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 gap-1.5 rounded-lg text-xs"
                            disabled={isRetrying || isDismissing}
                            onClick={() => setSelectedForRetry(log)}
                          >
                            <RefreshCw className="size-3.5" />
                            Retry & Credit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                            disabled={isRetrying || isDismissing}
                            onClick={() => setSelectedForDismiss(log)}
                          >
                            <XCircle className="mr-1 size-3.5" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Confirm Modals ───────────────────────────────────────────────────── */}

      {/* Retry Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(selectedForRetry)}
        onOpenChange={(open) => !open && setSelectedForRetry(null)}
        title="Credit Customer Reward?"
        description={`This will manually issue the pending reward for "${selectedForRetry?.campaign?.title || "Campaign"}" directly to ${selectedForRetry?.customer?.name || "the customer"} and mark this issue as resolved.`}
        confirmText="Credit Reward"
        cancelText="Cancel"
        onConfirm={handleConfirmRetry}
      />

      {/* Dismiss Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(selectedForDismiss)}
        onOpenChange={(open) => !open && setSelectedForDismiss(null)}
        title="Dismiss Failure Issue?"
        description="Are you sure you want to mark this failure log as resolved without crediting any reward to the customer?"
        confirmText="Dismiss Issue"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDismiss}
      />

      {/* Stack Trace Inspection Dialog */}
      <Dialog
        open={Boolean(viewingStackLog)}
        onOpenChange={(open) => !open && setViewingStackLog(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="size-5" />
              Failure Error Details
            </DialogTitle>
            <DialogDescription>
              Context: {viewingStackLog?.context}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Error Message
              </p>
              <p className="mt-1 rounded-lg bg-rose-500/10 p-3 font-mono text-xs text-rose-700 dark:text-rose-300">
                {viewingStackLog?.errorMessage}
              </p>
            </div>

            {viewingStackLog?.errorStack && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Stack Trace
                </p>
                <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-muted p-3 font-mono text-[11px] text-muted-foreground">
                  {viewingStackLog.errorStack}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
