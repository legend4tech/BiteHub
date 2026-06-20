"use client"

import Link from "next/link"
import { Store, Plus, Power, ChevronRight, KeyRound, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import type { AdminVendor } from "./types"

interface AdminVendorsProps {
  vendors: AdminVendor[]
  optimisticVendors: AdminVendor[]
  loadingVendors: boolean
  noAccountVendors: AdminVendor[]
  togglingId: string | null
  togglingFeaturedId: string | null
  onToggleActive: (vendor: AdminVendor) => void
  onToggleFeatured: (vendor: AdminVendor) => void
  onAddLogin: (vendor: AdminVendor) => void
}

export function AdminVendors({
  vendors,
  optimisticVendors,
  loadingVendors,
  noAccountVendors,
  togglingId,
  togglingFeaturedId,
  onToggleActive,
  onToggleFeatured,
  onAddLogin,
}: AdminVendorsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Vendors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage vendor profiles and login accounts
          </p>
        </div>
        <Button variant="hero" asChild className="gap-2">
          <Link href="/admin/vendors/new">
            <Plus className="size-4" /> Add Vendor
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm font-semibold">
            {optimisticVendors.length} vendors total
          </p>
          <p className="text-xs text-muted-foreground">
            {optimisticVendors.filter((v) => v.isActive).length} active ·{" "}
            {optimisticVendors.filter((v) => v.isFeatured).length} featured ·{" "}
            {noAccountVendors.length} without login
          </p>
        </div>

        {loadingVendors ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 px-6 py-4"
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-muted" />
                  <div className="h-2 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Store className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-semibold">No vendors yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <Link
                href="/admin/vendors/new"
                className="text-primary hover:underline"
              >
                Create your first vendor
              </Link>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {optimisticVendors.map((vendor) => {
              const initials = vendor.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
              return (
                <div
                  key={vendor.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                >
                  {/* Avatar */}
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
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
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {vendor.name}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${vendor.isActive ? "bg-status-completed/20 text-status-completed-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {vendor.isActive ? "Active" : "Inactive"}
                      </span>
                      {vendor.account ? (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${vendor.account.isActive ? "bg-status-confirmed/20 text-status-confirmed-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          Login{" "}
                          {vendor.account.isActive ? "active" : "disabled"}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-status-pending/20 px-2 py-0.5 text-[10px] font-bold text-status-pending-foreground">
                          No login
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {vendor.whatsappNumber} · {vendor.campus}
                      {vendor.account && (
                        <span className="ml-2 text-primary/70">
                          · {vendor.account.email}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    {vendor.isFeatured ? (
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 transition-opacity ${togglingFeaturedId === vendor.id ? "cursor-not-allowed opacity-50" : ""}`}
                            title="Remove from featured"
                            disabled={togglingFeaturedId === vendor.id}
                          >
                            <Star
                              className={`size-4 fill-primary text-primary ${togglingFeaturedId === vendor.id ? "scale-75" : ""}`}
                            />
                          </Button>
                        }
                        title="Remove from Featured?"
                        description={`Are you sure you want to remove ${vendor.name} from the featured list on the landing page?`}
                        confirmText="Yes, remove"
                        isDestructive
                        onConfirm={() => onToggleFeatured(vendor)}
                      />
                    ) : (
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 transition-opacity ${togglingFeaturedId === vendor.id ? "cursor-not-allowed opacity-50" : ""}`}
                            title="Feature this vendor"
                            disabled={togglingFeaturedId === vendor.id}
                          >
                            <Star
                              className={`size-4 text-muted-foreground ${togglingFeaturedId === vendor.id ? "scale-75" : ""}`}
                            />
                          </Button>
                        }
                        title="Feature Vendor?"
                        description={`Are you sure you want to feature ${vendor.name} on the landing page?`}
                        confirmText="Yes, feature vendor"
                        onConfirm={() => onToggleFeatured(vendor)}
                      />
                    )}

                    {!vendor.account && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 border-status-pending/30 text-xs text-status-pending-foreground hover:bg-status-pending/10"
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
                            className={`h-8 w-8 transition-opacity ${togglingId === vendor.id ? "cursor-not-allowed opacity-50" : ""}`}
                            title="Deactivate storefront"
                            disabled={togglingId === vendor.id}
                          >
                            <Power
                              className={`size-4 text-destructive ${togglingId === vendor.id ? "scale-75" : ""}`}
                            />
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
                        className={`h-8 w-8 transition-opacity ${togglingId === vendor.id ? "cursor-not-allowed opacity-50" : ""}`}
                        title="Activate storefront"
                        onClick={() => onToggleActive(vendor)}
                        disabled={togglingId === vendor.id}
                      >
                        <Power
                          className={`size-4 text-status-completed-foreground ${togglingId === vendor.id ? "scale-75" : ""}`}
                        />
                      </Button>
                    )}

                    <Link href={`/vendors/${vendor.slug}`} target="_blank">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View storefront"
                      >
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Button>
                    </Link>
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
