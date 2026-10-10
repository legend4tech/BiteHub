"use client"
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  X,
  KeyRound,
  Store,
  Wallet,
  ArrowDownToLine,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import type {} from "@/types/shared"
import { useAdminOrders } from "@/hooks/admin/useAdminOrders"
import { useAdminLogWithdrawal } from "@/hooks/admin/useAdminMutations"
import { formatPriceExact as formatPrice } from "@/lib/format"
import { toast } from "sonner"
import type { AdminStats, AdminVendor } from "@/types/admin"
import { StatCard, WithdrawalModal } from "./AdminOverviewWidgets"
import { AdminRecentOrdersFeed } from "./AdminRecentOrdersFeed"
// ─── Overview Section ─────────────────────────────────────────────────────────
interface AdminOverviewProps {
  stats: AdminStats | undefined
  loadingStats: boolean
  noAccountVendors: AdminVendor[]
  onGoToVendors: () => void
  onRefresh: () => void
}
export function AdminOverview({
  stats,
  loadingStats,
  noAccountVendors,
  onGoToVendors,
  onRefresh,
}: AdminOverviewProps) {
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawRef, setWithdrawRef] = useState("")
  const [withdrawNote, setWithdrawNote] = useState("")
  const logWithdrawal = useAdminLogWithdrawal()
  async function handleLogWithdrawal() {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0 || !withdrawRef.trim()) {
      toast.error("Please enter a valid amount and reference.")
      return
    }
    logWithdrawal.mutate(
      {
        amount,
        reference: withdrawRef.trim(),
        note: withdrawNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Withdrawal logged successfully!")
          setShowWithdrawalModal(false)
          setWithdrawAmount("")
          setWithdrawRef("")
          setWithdrawNote("")
          onRefresh()
        },
        onError: () => {
          toast.error("Failed to log withdrawal. Please try again.")
        },
      }
    )
  }
  // Fetch the 5 most recent orders for the quick feed
  const {
    data: recentOrdersData,
    isLoading: loadingOrders,
    isError: ordersError,
    refetch: refetchOrders,
  } = useAdminOrders(1, 5, undefined, undefined, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  })
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform stats at a glance
          </p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          disabled={loadingStats}
        >
          Refresh Stats
        </Button>
      </div>
      {loadingStats ? (
        <PageSkeleton variant="admin-overview-stats" count={8} />
      ) : stats ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingBag}
              sub={`${stats.todayOrders} today`}
            />
            <StatCard
              label="Completed Orders"
              value={stats.completedOrders}
              icon={CheckCircle2}
              accent
            />
            <StatCard
              label="Pending Orders"
              value={stats.pendingOrders}
              icon={Clock}
              sub="Awaiting vendor"
            />
            <StatCard
              label="Cancelled Orders"
              value={stats.cancelledOrders}
              icon={X}
            />
          </div>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              label="Gross Volume (GMV)"
              value={formatPrice(stats.grossVolumeInKobo)}
              icon={TrendingUp}
              sub="Total money processed"
              accent
            />
            <StatCard
              label="Total Vendors"
              value={stats.totalVendors}
              icon={Store}
            />
            <StatCard
              label="Active Vendors"
              value={stats.activeVendors}
              icon={Users}
              sub={`of ${stats.totalVendors} total`}
            />
          </div>
          {/* ── Financial Health Section ──────────────────────────── */}
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-br from-primary/5 via-transparent to-transparent px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
                  <Wallet className="size-5 text-primary" />
                  Financial Health & Ledger
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor the platform&apos;s liquidity, available profit, and
                  customer liabilities.
                </p>
              </div>
              <Button
                onClick={() => setShowWithdrawalModal(true)}
                className="gap-2 shadow-sm"
              >
                <ArrowDownToLine className="size-4" />
                Log Withdrawal
              </Button>
            </div>
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5 lg:divide-y-0">
              {/* All-time profit */}
              <div className="flex flex-col p-6 hover:bg-muted/10">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <div className="flex size-6 items-center justify-center rounded-md bg-muted">
                    <TrendingUp className="size-3.5" />
                  </div>
                  All-Time Profit
                </div>
                <p className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
                  {formatPrice(stats.allTimePlatformProfitInKobo)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total gross commission earned
                </p>
              </div>
              {/* Total withdrawn */}
              <div className="flex flex-col p-6 hover:bg-muted/10">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <div className="flex size-6 items-center justify-center rounded-md bg-muted">
                    <ArrowDownToLine className="size-3.5" />
                  </div>
                  Total Withdrawn
                </div>
                <p className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
                  {formatPrice(stats.totalWithdrawnInKobo)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Previously transferred to your bank
                </p>
              </div>
              {/* Remaining profit */}
              <div className="flex flex-col bg-primary/5 p-6 shadow-[inset_1px_0_0_0_hsl(var(--primary)/0.1)] hover:bg-primary/10">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                  <div className="flex size-6 items-center justify-center rounded-md bg-primary/20">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  Available Profit
                </div>
                <p className="font-heading text-3xl font-extrabold tracking-tight text-primary">
                  {formatPrice(stats.remainingProfitInKobo)}
                </p>
                <p className="mt-2 text-xs text-primary/70">
                  Safe to withdraw right now
                </p>
              </div>
              {/* Customer liabilities */}
              <div className="flex flex-col bg-destructive/5 p-6 shadow-[inset_1px_0_0_0_hsl(var(--destructive)/0.1)] hover:bg-destructive/10">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-destructive uppercase">
                  <div className="flex size-6 items-center justify-center rounded-md bg-destructive/20">
                    <AlertTriangle className="size-3.5" />
                  </div>
                  User Wallets
                </div>
                <p className="font-heading text-3xl font-extrabold tracking-tight text-destructive">
                  {formatPrice(stats.totalCustomerWalletLiabilitiesInKobo)}
                </p>
                <p className="mt-2 text-xs text-destructive/70">
                  Do NOT withdraw — belongs to users
                </p>
              </div>
              {/* Vendor liabilities */}
              <div className="flex flex-col bg-destructive/5 p-6 shadow-[inset_1px_0_0_0_hsl(var(--destructive)/0.1)] hover:bg-destructive/10">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-destructive uppercase">
                  <div className="flex size-6 items-center justify-center rounded-md bg-destructive/20">
                    <Store className="size-3.5" />
                  </div>
                  Vendor Payouts
                </div>
                <p className="font-heading text-3xl font-extrabold tracking-tight text-destructive">
                  {formatPrice(stats.totalPendingVendorWalletInKobo)}
                </p>
                <p className="mt-2 text-xs text-destructive/70">
                  Do NOT withdraw — owed to vendors
                </p>
              </div>
            </div>
            {/* Reconciliation health check */}
            <div className="border-t border-border bg-muted/20">
              {stats.monnifyBalanceInKobo !== null ? (
                (() => {
                  const expected =
                    stats.remainingProfitInKobo +
                    stats.totalCustomerWalletLiabilitiesInKobo +
                    stats.totalPendingVendorWalletInKobo
                  const gap = Math.abs(
                    (stats.monnifyBalanceInKobo ?? 0) - expected
                  )
                  const isHealthy = gap < 50000 // within ₦500 tolerance (50000 kobo)
                  return (
                    <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          <div className="flex size-6 items-center justify-center rounded-md bg-muted">
                            <Store className="size-3.5" />
                          </div>
                          Live Monnify Account Balance
                        </div>
                        <p className="font-heading text-4xl font-extrabold tracking-tight">
                          {formatPrice(stats.monnifyBalanceInKobo ?? 0)}
                        </p>
                      </div>
                      <div
                        className={`flex flex-1 items-center gap-4 rounded-2xl px-5 py-4 shadow-sm ${
                          isHealthy
                            ? "border border-status-completed/20 bg-status-completed/10"
                            : "border border-status-pending/20 bg-status-pending/10"
                        }`}
                      >
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                            isHealthy
                              ? "bg-status-completed/20 text-status-completed"
                              : "bg-status-pending/20 text-status-pending"
                          }`}
                        >
                          {isHealthy ? (
                            <ShieldCheck className="size-5" />
                          ) : (
                            <AlertTriangle className="size-5" />
                          )}
                        </div>
                        <div className="text-sm">
                          <p
                            className={`font-bold ${isHealthy ? "text-status-completed-foreground" : "text-status-pending-foreground"}`}
                          >
                            {isHealthy
                              ? "Ledger is perfectly balanced ✓"
                              : "Reconciliation gap detected"}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              Expected:{" "}
                              <strong className="text-foreground">
                                {formatPrice(expected)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Difference:{" "}
                              <strong
                                className={
                                  isHealthy
                                    ? "text-foreground"
                                    : "text-destructive"
                                }
                              >
                                {formatPrice(gap)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Unable to fetch live Monnify balance.
                </div>
              )}
            </div>
          </div>
          {/* ── Withdrawal Modal ──────────────────────────────────── */}
          <WithdrawalModal
            show={showWithdrawalModal}
            onClose={() => setShowWithdrawalModal(false)}
            withdrawAmount={withdrawAmount}
            setWithdrawAmount={setWithdrawAmount}
            withdrawRef={withdrawRef}
            setWithdrawRef={setWithdrawRef}
            withdrawNote={withdrawNote}
            setWithdrawNote={setWithdrawNote}
            submitting={logWithdrawal.isPending}
            onSubmit={handleLogWithdrawal}
          />
          {noAccountVendors.length > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-status-pending/30 bg-status-pending/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <KeyRound className="size-5 shrink-0 text-status-pending" />
                <div>
                  <p className="text-sm font-semibold text-status-pending-foreground">
                    {noAccountVendors.length} vendor
                    {noAccountVendors.length > 1 ? "s" : ""} without a login
                    account
                  </p>
                  <p className="text-xs text-muted-foreground">
                    They can&apos;t log in to their dashboard until you create
                    one.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGoToVendors}
                className="shrink-0 border-status-pending/30 text-status-pending-foreground hover:bg-status-pending/10"
              >
                Fix now
              </Button>
            </div>
          )}
          <AdminRecentOrdersFeed
            loadingOrders={loadingOrders}
            error={ordersError}
            onRetry={refetchOrders}
            recentOrdersData={recentOrdersData}
          />
        </>
      ) : (
        <FetchError message="Failed to load stats." onRetry={onRefresh} />
      )}
    </div>
  )
}
