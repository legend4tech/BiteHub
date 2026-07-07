"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Store,
  Plus,
  Power,
  ChevronRight,
  KeyRound,
  Star,
  Filter,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import type { AdminVendor } from "@/components/admin/types"

interface VendorManagerVendorsProps {
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

export function VendorManagerVendors({
  vendors,
  optimisticVendors,
  loadingVendors,
  noAccountVendors,
  togglingId,
  togglingFeaturedId,
  onToggleActive,
  onToggleFeatured,
  onAddLogin,
}: VendorManagerVendorsProps) {
  const pathname = usePathname()
  const basePath = pathname.startsWith("/vendor-manager")
    ? "/vendor-manager"
    : "/admin"

  const [filter, setFilter] = useState<
    "all" | "active" | "inactive" | "no_login" | "pending_monnify" | "no_menu"
  >("all")

  const filteredVendors = optimisticVendors.filter((v) => {
    if (filter === "active") return v.isActive
    if (filter === "inactive") return !v.isActive
    if (filter === "no_login") return !v.account
    if (filter === "pending_monnify")
      return v.monnifyIntegrationStatus === "pending"
    if (filter === "no_menu") return !v.hasMenu
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Vendors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage vendor profiles and login accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) =>
                setFilter(
                  e.target.value as
                    | "all"
                    | "active"
                    | "inactive"
                    | "no_login"
                    | "pending_monnify"
                )
              }
              className="h-10 appearance-none rounded-xl border border-border bg-card pr-8 pl-10 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="all">All Vendors</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="no_login">No Login Setup</option>
              <option value="pending_monnify">Pending Bank Setup</option>
              <option value="no_menu">Empty Menu</option>
            </select>
            <Filter className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <svg className="size-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          <Button variant="hero" asChild className="gap-2">
            <Link href={`${basePath}/vendors/new`}>
              <Plus className="size-4" /> Add Vendor
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm font-semibold">
            {optimisticVendors.length} vendors total
          </p>
          <p className="text-xs text-muted-foreground">
            {optimisticVendors.filter((v) => v.isActive).length} active ·{" "}
            {optimisticVendors.filter((v) => !v.hasMenu).length} empty menu ·{" "}
            {noAccountVendors.length} without login
          </p>
        </div>

        {loadingVendors ? (
          <PageSkeleton variant="admin-list" count={4} />
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={<Store className="size-12 text-muted-foreground" />}
            title="No vendors yet"
            description="Get started by adding your first vendor."
            action={{
              label: "Add Vendor",
              href: `${basePath}/vendors/new`,
              icon: <Plus className="size-4" />,
            }}
          />
        ) : filteredVendors.length === 0 ? (
          <EmptyState
            icon={<Filter className="size-12 text-muted-foreground" />}
            title="No vendors found"
            description="Try changing your filter to see more vendors."
            action={{
              label: "Clear filter",
              onClick: () => setFilter("all"),
            }}
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredVendors.map((vendor) => {
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
                      {vendor.onboardedByName && (
                        <span
                          className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase"
                          title={`Onboarded by ${vendor.onboardedByName}`}
                        >
                          By {vendor.onboardedByName.split(" ")[0]}
                        </span>
                      )}
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
                      {!vendor.hasMenu && (
                        <span
                          className="flex shrink-0 items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive"
                          title="This vendor has not added any menu items yet."
                        >
                          <UtensilsCrossed className="size-3" /> No Menu
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
