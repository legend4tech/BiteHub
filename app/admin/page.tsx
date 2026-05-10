"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Store, ShoppingBag, CheckCircle2, Clock, Users,
  TrendingUp, Plus, X, Power, ArrowLeft, Loader2,
  ChevronRight, RefreshCw, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalVendors: number;
  activeVendors: number;
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

interface VendorAccount {
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface AdminVendor {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  whatsappNumber: string;
  campus: string;
  isActive: boolean;
  createdAt: string;
  account: VendorAccount | null;
}

// ─── Add Login Schema ─────────────────────────────────────────────────────────

const addLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type AddLoginValues = z.infer<typeof addLoginSchema>;

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
      <div>
        <p className={`text-3xl font-bold font-heading ${accent ? "text-primary" : ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Add Login Modal ──────────────────────────────────────────────────────────

function AddLoginModal({
  vendor,
  onClose,
  onSuccess,
}: {
  vendor: AdminVendor;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AddLoginValues>({
    // `as any` needed: @hookform/resolvers typed against Zod 4.0.x; project uses 4.4.x
    resolver: zodResolver(addLoginSchema as any),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: AddLoginValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}/account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create login");
        return;
      }
      toast.success(`Login account created for ${vendor.name}`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-heading font-bold text-lg">Create Login Account</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              For <span className="font-semibold text-foreground">{vendor.name}</span>
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="-mt-1 -mr-1">
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller name="email" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
              <Input {...field} id={field.name} type="email" placeholder="vendor@email.com" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          <Controller name="password" control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Password *</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  aria-invalid={fieldState.invalid}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )} />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<"overview" | "vendors">("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [addLoginFor, setAddLoginFor] = useState<AdminVendor | null>(null);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    setLoadingVendors(true);
    try {
      const res = await fetch("/api/admin/vendors");
      if (res.ok) setVendors(await res.json());
    } finally {
      setLoadingVendors(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchVendors();
  }, [fetchStats, fetchVendors]);

  const toggleVendorActive = async (vendor: AdminVendor) => {
    setTogglingId(vendor.id);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !vendor.isActive }),
      });
      if (res.ok) {
        setVendors((prev) =>
          prev.map((v) => v.id === vendor.id ? { ...v, isActive: !v.isActive } : v)
        );
        toast.success(`Vendor ${!vendor.isActive ? "activated" : "deactivated"}`);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const noAccountVendors = vendors.filter((v) => !v.account);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Store className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-none">CampusBites</p>
                <p className="font-heading font-bold text-sm leading-tight">Admin Dashboard</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => { fetchStats(); fetchVendors(); }}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b border-border">
          {(["overview", "vendors"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors relative ${tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
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
                  <StatCard label="Total Vendors" value={stats.totalVendors} icon={Store} sub={`${stats.activeVendors} active`} />
                  <StatCard label="Total Orders" value={stats.totalOrders} icon={ShoppingBag} sub={`${stats.todayOrders} today`} />
                  <StatCard label="Completed Orders" value={stats.completedOrders} icon={CheckCircle2} accent />
                  <StatCard label="Total Revenue" value={formatPrice(stats.totalRevenue)} icon={TrendingUp} accent />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Pending" value={stats.pendingOrders} icon={Clock} sub="Awaiting vendor" />
                  <StatCard label="Active Vendors" value={stats.activeVendors} icon={Users} sub={`of ${stats.totalVendors} total`} />
                  <StatCard label="Cancelled" value={stats.cancelledOrders} icon={X} />
                  <StatCard label="Today's Orders" value={stats.todayOrders} icon={TrendingUp} />
                </div>

                {/* Alert: vendors without login */}
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
                    <Button variant="outline" size="sm" onClick={() => setTab("vendors")} className="shrink-0 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10">
                      Fix now
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Failed to load stats.</p>
            )}
          </div>
        )}

        {/* ── VENDORS ── */}
        {tab === "vendors" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading font-bold text-2xl">Vendors</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage vendor profiles and login accounts</p>
              </div>
              <Button variant="hero" asChild className="gap-2">
                <Link href="/admin/vendors/new">
                  <Plus className="size-4" /> Add Vendor
                </Link>
              </Button>
            </div>

            {/* Vendors list */}
            <div className="rounded-3xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <p className="font-semibold text-sm">{vendors.length} vendors total</p>
                <p className="text-xs text-muted-foreground">{vendors.filter((v) => v.isActive).length} active · {noAccountVendors.length} without login</p>
              </div>

              {loadingVendors ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                      <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-1/3" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : vendors.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <Store className="size-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold">No vendors yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Link href="/admin/vendors/new" className="text-primary hover:underline">Create your first vendor</Link>
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {vendors.map((vendor) => {
                    const initials = vendor.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <div key={vendor.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-xl grid place-items-center text-primary-foreground font-bold text-sm shrink-0 bg-primary shadow-lg shadow-primary/20">
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate">{vendor.name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${vendor.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                              {vendor.isActive ? "Active" : "Inactive"}
                            </span>
                            {vendor.account ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${vendor.account.isActive ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-muted text-muted-foreground"}`}>
                                Login {vendor.account.isActive ? "active" : "disabled"}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                No login
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {vendor.whatsappNumber} · {vendor.campus}
                            {vendor.account && <span className="ml-2 text-primary/70">· {vendor.account.email}</span>}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Add login button for vendors without account */}
                          {!vendor.account && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                              onClick={() => setAddLoginFor(vendor)}
                            >
                              <KeyRound className="size-3" />
                              Add login
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={vendor.isActive ? "Deactivate storefront" : "Activate storefront"}
                            onClick={() => toggleVendorActive(vendor)}
                            disabled={togglingId === vendor.id}
                          >
                            {togglingId === vendor.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Power className={`size-4 ${vendor.isActive ? "text-destructive" : "text-green-600"}`} />
                            )}
                          </Button>

                          <Link href={`/vendors/${vendor.slug}`} target="_blank">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="View storefront">
                              <ChevronRight className="size-4 text-muted-foreground" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Login Modal */}
      {addLoginFor && (
        <AddLoginModal
          vendor={addLoginFor}
          onClose={() => setAddLoginFor(null)}
          onSuccess={fetchVendors}
        />
      )}
    </div>
  );
}
