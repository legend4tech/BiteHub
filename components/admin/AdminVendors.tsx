"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
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
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import type { AdminVendor } from "@/types/admin"

interface AdminVendorsProps {
  vendors: AdminVendor[]
  optimisticVendors: AdminVendor[]
  loadingVendors: boolean
  noAccountVendors: AdminVendor[]
  togglingId: string | null
  togglingFeaturedId: string | null
  togglingManagedId: string | null
  onToggleActive: (vendor: AdminVendor) => void
  onToggleFeatured: (vendor: AdminVendor) => void
  onToggleManaged: (vendor: AdminVendor, isManaged: boolean) => void
  onAddLogin: (vendor: AdminVendor) => void
}

export function AdminVendors({
  vendors,
  optimisticVendors,
  loadingVendors,
  noAccountVendors,
  togglingId,
  togglingFeaturedId,
  togglingManagedId,
  onToggleActive,
  onToggleFeatured,
  onToggleManaged,
  onAddLogin,
}: AdminVendorsProps) {
  const pathname = usePathname()
  const basePath = pathname.startsWith("/vendor-manager")
    ? "/vendor-manager"
    : "/admin"

  const [filter, setFilter] = useState<
    "all" | "active" | "inactive" | "no_login" | "pending_monnify" | "no_menu"
  >("all")

  const [managedModalVendorId, setManagedModalVendorId] = useState<
    string | null
  >(null)
  const [pendingManagedStatus, setPendingManagedStatus] = useState<
    boolean | null
  >(null)

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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
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
            {optimisticVendors.filter((v) => v.isFeatured).length} featured ·{" "}
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
                        <Image
                          src={vendor.image.url}
                          alt={vendor.name}
                          width={40}
                          height={40}
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
                      <div className="flex flex-wrap items-center gap-2">
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
                        {vendor.isManagedByBiteHub && (
                          <span
                            className="flex shrink-0 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
                            title="Managed by BiteHub"
                          >
                            <ShieldCheck className="size-3" /> Managed
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs break-words text-muted-foreground">
                        {vendor.whatsappNumber} · {vendor.campus}
                        {vendor.account && (
                          <span className="ml-2 inline-block text-primary/70">
                            · {vendor.account.email}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2 pt-2 pl-[56px] sm:gap-4 md:pt-0 md:pl-0">
                    <div
                      className="flex items-center space-x-2 border-r border-border pr-4"
                      title="Toggle Managed Status"
                    >
                      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        Managed
                      </span>
                      <Switch
                        checked={
                          (managedModalVendorId === vendor.id ||
                            togglingManagedId === vendor.id) &&
                          pendingManagedStatus !== null
                            ? pendingManagedStatus
                            : vendor.isManagedByBiteHub
                        }
                        onCheckedChange={(val) => {
                          setPendingManagedStatus(val)
                          setManagedModalVendorId(vendor.id)
                        }}
                        disabled={togglingManagedId === vendor.id}
                        className="scale-75 data-[state=checked]:bg-primary"
                      />
                    </div>

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
                  </div>

                  <Link
                    href={`/vendors/${vendor.slug}`}
                    target="_blank"
                    className="absolute top-4 right-4 md:static"
                  >
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
              )
            })}
          </div>
        )}
      </div>

      {managedModalVendorId && (
        <ConfirmDialog
          open={!!managedModalVendorId}
          onOpenChange={(open) => {
            if (!open) {
              setManagedModalVendorId(null)
            }
          }}
          title={
            pendingManagedStatus
              ? "Make Managed Vendor?"
              : "Remove Managed Status?"
          }
          description={
            pendingManagedStatus
              ? "Are you sure you want to manage this vendor? This allows them to safely share a central bank account for payouts."
              : "Are you sure you want to stop managing this vendor? They will no longer be able to share a central bank account with other vendors."
          }
          confirmText={
            pendingManagedStatus
              ? "Yes, manage vendor"
              : "Yes, remove managed status"
          }
          isDestructive={!pendingManagedStatus}
          onConfirm={() => {
            const vendor = optimisticVendors.find(
              (v) => v.id === managedModalVendorId
            )
            if (vendor && pendingManagedStatus !== null) {
              onToggleManaged(vendor, pendingManagedStatus)
            }
            setManagedModalVendorId(null)
          }}
        />
      )}
    </div>
  )
}
