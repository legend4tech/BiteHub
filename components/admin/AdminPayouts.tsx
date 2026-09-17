"use client"

import { useState } from "react"
import { RefreshCcw, Activity, AlertTriangle, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import type { AdminVendor, AdminStats } from "@/types/admin"

interface AdminPayoutsProps {
  vendors: AdminVendor[]
  stats?: AdminStats
  loadingVendors: boolean
  loadingStats: boolean
  onRetryPayout: (vendor: AdminVendor) => void
  retryingId: string | null
}

export function AdminPayouts({
  vendors,
  stats,
  loadingVendors,
  loadingStats,
  onRetryPayout,
  retryingId,
}: AdminPayoutsProps) {
  // Filter only vendors that have a pending wallet balance
  const vendorsWithPendingPayouts = vendors.filter(
    (v) => v.pendingWalletBalance !== undefined && v.pendingWalletBalance > 0
  )

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold">Vendor Payouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and retry stuck wallet disbursements.
          </p>
        </div>
      </div>

      {/* Global Stats */}
      {loadingStats ? (
        <PageSkeleton variant="admin-overview-stats" count={2} />
      ) : stats ? (
        <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col bg-destructive/5 p-6 shadow-[inset_1px_0_0_0_hsl(var(--destructive)/0.1)] hover:bg-destructive/10">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-destructive uppercase">
              <div className="flex size-6 items-center justify-center rounded-md bg-destructive/20">
                <AlertTriangle className="size-3.5" />
              </div>
              Global Pending Payouts
            </div>
            <p className="font-heading text-3xl font-extrabold tracking-tight text-destructive">
              {formatPrice(stats.totalPendingVendorWallet)}
            </p>
            <p className="mt-2 text-xs text-destructive/70">
              Total funds pending disbursement to vendors
            </p>
          </div>

          <div className="flex flex-col p-6 hover:bg-muted/10">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <div className="flex size-6 items-center justify-center rounded-md bg-muted">
                <Activity className="size-3.5" />
              </div>
              Lifetime Wallet Disbursements
            </div>
            <p className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
              {formatPrice(stats.totalVendorWalletDisbursed)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Total funds successfully disbursed via Wallet
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm font-semibold">
            {vendorsWithPendingPayouts.length} vendors awaiting payout
          </p>
        </div>

        {loadingVendors ? (
          <PageSkeleton variant="admin-list" count={4} />
        ) : vendorsWithPendingPayouts.length === 0 ? (
          <EmptyState
            icon={<Banknote className="size-12 text-muted-foreground" />}
            title="No pending payouts"
            description="All vendor wallet balances have been successfully settled."
          />
        ) : (
          <div className="divide-y divide-border">
            {vendorsWithPendingPayouts.map((vendor) => {
              const initials = vendor.name
                .split(" ")
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
              return (
                <div
                  key={vendor.id}
                  className="relative flex flex-col justify-between gap-4 px-4 py-4 pr-12 transition-colors hover:bg-muted/30 sm:px-6 md:flex-row md:items-center md:pr-6"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    {/* Avatar */}
                    <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                      {vendor.image?.url ? (
                        <img
                          src={vendor.image.url}
                          alt={vendor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <p className="text-base leading-tight font-bold break-words text-foreground">
                        {vendor.name}
                      </p>
                      <p className="mt-0.5 text-xs break-words text-muted-foreground">
                        {vendor.whatsappNumber} · {vendor.campus}
                      </p>

                      <div className="mt-1 flex flex-col gap-1 text-sm">
                        <p>
                          <span className="font-medium text-muted-foreground">
                            Bank Code:
                          </span>{" "}
                          <span className="font-semibold">
                            {vendor.monnifyBankCode || "Not set"}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-muted-foreground">
                            Account:
                          </span>{" "}
                          <span className="font-semibold">
                            {vendor.monnifyAccountNumber || "Not set"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Balance */}
                  <div className="flex shrink-0 flex-col items-end gap-3 pt-2 pl-[56px] md:pt-0 md:pl-0">
                    <p className="font-heading text-xl font-bold text-destructive">
                      {formatPrice(vendor.pendingWalletBalance || 0)}
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => onRetryPayout(vendor)}
                      disabled={retryingId === vendor.id}
                      title="Retry sending the pending payout to their Monnify account"
                    >
                      <RefreshCcw
                        className={`size-3 ${retryingId === vendor.id ? "animate-spin" : ""}`}
                      />
                      Retry Payout
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
