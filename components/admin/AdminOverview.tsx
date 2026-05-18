"use client";

import { ShoppingBag, CheckCircle2, Clock, Users, TrendingUp, X, KeyRound, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { AdminStats, AdminVendor } from "./types";
import type { AdminSection } from "./AdminSidebar";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, accent = false, sub,
}: {
  label: string; value: string | number; icon: React.ElementType; accent?: boolean; sub?: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${accent ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="min-w-0">
        <p
          title={String(value)}
          className={`text-2xl font-bold font-heading truncate ${accent ? "text-primary" : ""}`}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Overview Section ─────────────────────────────────────────────────────────

interface AdminOverviewProps {
  stats: AdminStats | undefined;
  loadingStats: boolean;
  noAccountVendors: AdminVendor[];
  onGoToVendors: () => void;
}

export function AdminOverview({ stats, loadingStats, noAccountVendors, onGoToVendors }: AdminOverviewProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-bold text-2xl">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform stats at a glance</p>
      </div>

      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Vendors"    value={stats.totalVendors}              icon={Store}        sub={`${stats.activeVendors} active`} />
            <StatCard label="Total Orders"     value={stats.totalOrders}               icon={ShoppingBag}  sub={`${stats.todayOrders} today`} />
            <StatCard label="Completed Orders" value={stats.completedOrders}           icon={CheckCircle2} accent />
            <StatCard label="Total Revenue"    value={formatPrice(stats.totalRevenue)} icon={TrendingUp}   accent />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Pending"        value={stats.pendingOrders}   icon={Clock}      sub="Awaiting vendor" />
            <StatCard label="Active Vendors" value={stats.activeVendors}   icon={Users}      sub={`of ${stats.totalVendors} total`} />
            <StatCard label="Cancelled"      value={stats.cancelledOrders} icon={X} />
            <StatCard label="Today's Orders" value={stats.todayOrders}     icon={TrendingUp} />
          </div>

          {noAccountVendors.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <KeyRound className="size-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {noAccountVendors.length} vendor{noAccountVendors.length > 1 ? "s" : ""} without a login account
                  </p>
                  <p className="text-xs text-muted-foreground">They can't log in to their dashboard until you create one.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGoToVendors}
                className="shrink-0 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              >
                Fix now
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Failed to load stats.</p>
      )}
    </div>
  );
}
