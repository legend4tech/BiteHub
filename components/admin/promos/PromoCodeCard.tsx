"use client"

import Link from "next/link"
import { PromoCode } from "@/types/promo"
import { formatPriceExact } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Copy, Check, Percent, Banknote, Pencil, Trash2 } from "lucide-react"

interface PromoCodeCardProps {
  promo: PromoCode
  copiedCode: string | null
  onCopy: (code: string) => void
  onToggle: (id: string, currentActive: boolean) => void
  isToggling: boolean
  onDeleteClick: (promo: PromoCode) => void
}

export function PromoCodeCard({
  promo,
  copiedCode,
  onCopy,
  onToggle,
  isToggling,
  onDeleteClick,
}: PromoCodeCardProps) {
  const spent = promo.budgetSpentInKobo || 0
  const allocated = promo.budgetAllocatedInKobo || 0
  const remaining = Math.max(0, allocated - spent)
  const percentSpent =
    allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0
  const isExhausted = remaining <= 0

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-border/80">
      {/* Header Row: Code, Title & Status Switch */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-base font-bold tracking-wider text-foreground">
              {promo.code}
            </span>
            <button
              onClick={() => onCopy(promo.code)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Copy code"
            >
              {copiedCode === promo.code ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {promo.title}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={promo.isActive && !isExhausted}
            disabled={isToggling || isExhausted}
            onCheckedChange={() => onToggle(promo.id, promo.isActive)}
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
            {isExhausted ? "Exhausted" : promo.isActive ? "Active" : "Paused"}
          </Badge>
        </div>
      </div>

      {/* Badges Row: Discount & Scope */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {promo.discountType === "PERCENTAGE" ? (
            <>
              <Percent className="h-3 w-3" />
              <span>{promo.discountPercentage}% off</span>
              {promo.maxDiscountInKobo && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  (Cap {formatPriceExact(promo.maxDiscountInKobo)})
                </span>
              )}
            </>
          ) : (
            <>
              <Banknote className="h-3 w-3" />
              <span>{formatPriceExact(promo.discountValueInKobo)} off</span>
            </>
          )}
        </div>

        {promo.targetMenuItemId ? (
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-[10px] text-primary"
          >
            Specific Meal
          </Badge>
        ) : promo.targetVendorId ? (
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-[10px] text-primary"
          >
            Specific Vendor
          </Badge>
        ) : promo.targetCampus ? (
          <Badge variant="secondary" className="text-[10px]">
            Campus: {promo.targetCampus.toUpperCase()}
          </Badge>
        ) : promo.targetSchool ? (
          <Badge variant="secondary" className="text-[10px]">
            School: {promo.targetSchool.toUpperCase()}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] text-muted-foreground"
          >
            All Schools
          </Badge>
        )}

        {promo.minOrderValueInKobo ? (
          <span className="text-[11px] text-muted-foreground">
            Min {formatPriceExact(promo.minOrderValueInKobo)}
          </span>
        ) : null}
      </div>

      {/* Budget & Subsidy Tracker */}
      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="text-muted-foreground">Budget Spent:</span>
          <span>
            {formatPriceExact(spent)} / {formatPriceExact(allocated)}
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">{percentSpent}% used</span>
          <span
            className={`font-mono font-semibold ${
              isExhausted ? "text-destructive" : "text-foreground"
            }`}
          >
            {formatPriceExact(remaining)} remaining
          </span>
        </div>
      </div>

      {/* Footer Row: Redemptions & Action Buttons */}
      <div className="flex items-center justify-between border-t border-border/50 pt-1 text-xs">
        <div className="font-mono text-muted-foreground">
          <span className="font-semibold text-foreground">
            {promo.currentRedemptions}
          </span>
          <span>
            {promo.maxRedemptions
              ? ` / ${promo.maxRedemptions} uses`
              : " uses claimed"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link href={`/admin/promos/${promo.id}/edit`}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteClick(promo)}
            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
