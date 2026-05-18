"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, Plus, Power, ChevronRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { AdminVendor } from "./types";

interface AdminVendorsProps {
  vendors: AdminVendor[];
  optimisticVendors: AdminVendor[];
  loadingVendors: boolean;
  noAccountVendors: AdminVendor[];
  togglingId: string | null;
  onToggleActive: (vendor: AdminVendor) => void;
  onAddLogin: (vendor: AdminVendor) => void;
}

export function AdminVendors({
  vendors,
  optimisticVendors,
  loadingVendors,
  noAccountVendors,
  togglingId,
  onToggleActive,
  onAddLogin,
}: AdminVendorsProps) {
  return (
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

      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <p className="font-semibold text-sm">{optimisticVendors.length} vendors total</p>
          <p className="text-xs text-muted-foreground">
            {optimisticVendors.filter((v) => v.isActive).length} active · {noAccountVendors.length} without login
          </p>
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
            {optimisticVendors.map((vendor) => {
              const initials = vendor.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={vendor.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-xl overflow-hidden grid place-items-center text-primary-foreground font-bold text-sm shrink-0 bg-primary shadow-lg shadow-primary/20">
                    {vendor.image?.url ? (
                      <img src={vendor.image.url} alt={vendor.name} className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
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
                    {!vendor.account && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                        onClick={() => onAddLogin(vendor)}
                      >
                        <KeyRound className="size-3" />
                        Add login
                      </Button>
                    )}

                    {vendor.isActive ? (
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 transition-opacity ${togglingId === vendor.id ? "opacity-50 cursor-not-allowed" : ""}`}
                            title="Deactivate storefront"
                            disabled={togglingId === vendor.id}
                          >
                            <Power className={`size-4 text-destructive ${togglingId === vendor.id ? "scale-75" : ""}`} />
                          </Button>
                        }
                        title="Deactivate Storefront?"
                        description={`Are you sure you want to deactivate ${vendor.name}? This will suspend their storefront, and students will not be able to place orders from them.`}
                        confirmText="Yes, deactivate"
                        isDestructive
                        onConfirm={() => onToggleActive(vendor)}
                      />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 transition-opacity ${togglingId === vendor.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        title="Activate storefront"
                        onClick={() => onToggleActive(vendor)}
                        disabled={togglingId === vendor.id}
                      >
                        <Power className={`size-4 text-green-600 ${togglingId === vendor.id ? "scale-75" : ""}`} />
                      </Button>
                    )}

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
  );
}
