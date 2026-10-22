"use client"

import { useState } from "react"
import Link from "next/link"
import { PromoCode } from "@/types/promo"
import { useTogglePromoStatus, useDeletePromo } from "@/hooks/admin/usePromos"
import { formatPriceExact } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { DataPagination } from "@/components/shared/DataPagination"
import { PromoCodeCard } from "./PromoCodeCard"
import { toast } from "sonner"
import {
  Copy,
  Trash2,
  Pencil,
  Check,
  Search,
  Percent,
  Banknote,
} from "lucide-react"

interface PromoCodeTableProps {
  promos: PromoCode[]
}

export function PromoCodeTable({ promos }: PromoCodeTableProps) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null)

  const { mutateAsync: toggleStatus, isPending: isToggling } =
    useTogglePromoStatus()
  const { mutateAsync: deletePromo } = useDeletePromo()

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Copied "${code}" to clipboard!`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleStatus({ id, isActive: !currentActive })
      toast.success(
        `Promo code ${!currentActive ? "activated" : "paused"} successfully`
      )
    } catch {
      toast.error("Failed to update promo status")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePromo(deleteTarget.id)
      toast.success(`Promo code ${deleteTarget.code} deleted`)
      setDeleteTarget(null)
    } catch {
      toast.error("Failed to delete promo code")
    }
  }

  const filtered = promos.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="space-y-4">
      {/* Search Bar & Summary Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search promo codes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? "promo code" : "promo codes"} found
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No promo codes match your search.
        </div>
      ) : (
        <>
          {/* Mobile Card View (block on mobile, hidden on desktop) */}
          <div className="block space-y-3 md:hidden">
            {paginated.map((promo) => (
              <PromoCodeCard
                key={promo.id}
                promo={promo}
                copiedCode={copiedCode}
                onCopy={handleCopy}
                onToggle={handleToggle}
                isToggling={isToggling}
                onDeleteClick={setDeleteTarget}
              />
            ))}
          </div>

          {/* Desktop Table View (hidden on mobile, block on desktop) */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3.5">Code & Title</th>
                    <th className="px-4 py-3.5">Discount</th>
                    <th className="px-4 py-3.5">Budget Spent / Total</th>
                    <th className="px-4 py-3.5">Remaining</th>
                    <th className="px-4 py-3.5">Redemptions</th>
                    <th className="px-4 py-3.5">Scope</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map((promo) => {
                    const spent = promo.budgetSpentInKobo || 0
                    const allocated = promo.budgetAllocatedInKobo || 0
                    const remaining = Math.max(0, allocated - spent)
                    const percentSpent =
                      allocated > 0
                        ? Math.min(100, Math.round((spent / allocated) * 100))
                        : 0
                    const isExhausted = remaining <= 0

                    return (
                      <tr
                        key={promo.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        {/* Code & Title */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold tracking-wider text-foreground">
                              {promo.code}
                            </span>
                            <button
                              onClick={() => handleCopy(promo.code)}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Copy code"
                            >
                              {copiedCode === promo.code ? (
                                <Check className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {promo.title}
                          </p>
                        </td>

                        {/* Discount Details */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 font-medium">
                            {promo.discountType === "PERCENTAGE" ? (
                              <>
                                <Percent className="h-3.5 w-3.5 text-primary" />
                                <span>{promo.discountPercentage}% off</span>
                                {promo.maxDiscountInKobo && (
                                  <span className="text-xs text-muted-foreground">
                                    (Cap{" "}
                                    {formatPriceExact(promo.maxDiscountInKobo)})
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <Banknote className="h-3.5 w-3.5 text-primary" />
                                <span>
                                  {formatPriceExact(promo.discountValueInKobo)}
                                </span>
                              </>
                            )}
                          </div>
                          {promo.minOrderValueInKobo ? (
                            <span className="text-[11px] text-muted-foreground">
                              Min {formatPriceExact(promo.minOrderValueInKobo)}
                            </span>
                          ) : null}
                        </td>

                        {/* Budget Progress */}
                        <td className="min-w-[160px] px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-xs">
                              <span>{formatPriceExact(spent)}</span>
                              <span className="text-muted-foreground">
                                {formatPriceExact(allocated)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isExhausted
                                    ? "bg-destructive"
                                    : percentSpent > 80
                                      ? "bg-primary/80"
                                      : "bg-primary"
                                }`}
                                style={{ width: `${percentSpent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {percentSpent}% budget used
                            </span>
                          </div>
                        </td>

                        {/* Remaining Budget */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`font-mono text-xs font-semibold ${
                              isExhausted
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {formatPriceExact(remaining)}
                          </span>
                        </td>

                        {/* Redemptions Count */}
                        <td className="px-4 py-3.5 font-mono text-xs">
                          <span className="font-bold">
                            {promo.currentRedemptions}
                          </span>
                          <span className="text-muted-foreground">
                            {promo.maxRedemptions
                              ? ` / ${promo.maxRedemptions}`
                              : " uses"}
                          </span>
                        </td>

                        {/* Scope Hierarchy */}
                        <td className="px-4 py-3.5">
                          {promo.targetMenuItemId ? (
                            <Badge
                              variant="outline"
                              className="border-primary/30 bg-primary/10 text-[10px] whitespace-nowrap text-primary"
                            >
                              Specific Meal
                            </Badge>
                          ) : promo.targetVendorId ? (
                            <Badge
                              variant="outline"
                              className="border-primary/30 bg-primary/10 text-[10px] whitespace-nowrap text-primary"
                            >
                              Specific Vendor
                            </Badge>
                          ) : promo.targetCampus ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] whitespace-nowrap"
                            >
                              Campus: {promo.targetCampus.toUpperCase()}
                            </Badge>
                          ) : promo.targetSchool ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] whitespace-nowrap"
                            >
                              School: {promo.targetSchool.toUpperCase()}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] whitespace-nowrap text-muted-foreground"
                            >
                              All Schools
                            </Badge>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={promo.isActive && !isExhausted}
                              disabled={isToggling || isExhausted}
                              onCheckedChange={() =>
                                handleToggle(promo.id, promo.isActive)
                              }
                            />
                            <Badge
                              variant={
                                isExhausted
                                  ? "destructive"
                                  : promo.isActive
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {isExhausted
                                ? "Exhausted"
                                : promo.isActive
                                  ? "Active"
                                  : "Paused"}
                            </Badge>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Link href={`/admin/promos/${promo.id}/edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(promo)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reusable Pagination */}
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Promo Code"
        description={`Are you sure you want to delete promo code "${deleteTarget?.code}"? If it has prior redemptions, it will be deactivated to preserve ledger history.`}
        confirmText="Delete"
        isDestructive={true}
        onConfirm={handleDelete}
      />
    </div>
  )
}
