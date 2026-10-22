"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePromos, usePromoRedemptions } from "@/hooks/admin/usePromos"
import { PromoCodeTable } from "@/components/admin/promos/PromoCodeTable"
import { PromoRedemptionsTable } from "@/components/admin/promos/PromoRedemptionsTable"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchError } from "@/components/shared/FetchError"
import { formatPriceExact } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  TicketPercent,
  Plus,
  Coins,
  TrendingUp,
  Users,
  Receipt,
} from "lucide-react"

export default function AdminPromosPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"promos" | "redemptions">("promos")

  const {
    data: promos,
    isLoading: isLoadingPromos,
    isError: isErrorPromos,
    refetch: refetchPromos,
  } = usePromos()

  const {
    data: redemptionsData,
    isLoading: isLoadingRedemptions,
    isError: isErrorRedemptions,
    refetch: refetchRedemptions,
  } = usePromoRedemptions()

  if (isLoadingPromos) {
    return <PageSkeleton variant="admin-promos" />
  }

  if (isErrorPromos) {
    return (
      <FetchError
        title="Failed to Load Promo Codes"
        message="Could not retrieve marketing promo codes from the server."
        onRetry={() => refetchPromos()}
      />
    )
  }

  const promoList = promos || []
  const redemptionsList = redemptionsData?.redemptions || []

  // Top metric calculations
  const totalCodes = promoList.length
  const activeCodes = promoList.filter((p) => p.isActive).length
  const totalAllocatedInKobo = promoList.reduce(
    (acc, p) => acc + (p.budgetAllocatedInKobo || 0),
    0
  )
  const totalSpentInKobo = promoList.reduce(
    (acc, p) => acc + (p.budgetSpentInKobo || 0),
    0
  )
  const totalRedemptions = promoList.reduce(
    (acc, p) => acc + (p.currentRedemptions || 0),
    0
  )

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            <TicketPercent className="h-7 w-7 text-primary" />
            Promo Codes & Discounts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create coupon campaigns, manage subsidy budgets, and track customer
            redemptions.
          </p>
        </div>

        <Button
          asChild
          className="flex items-center gap-2 font-semibold shadow-sm"
        >
          <Link href="/admin/promos/new">
            <Plus className="h-4 w-4" />
            Create Promo Code
          </Link>
        </Button>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Total Promos
            </span>
            <TicketPercent className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {totalCodes}
          </p>
          <span className="text-xs text-muted-foreground">
            {activeCodes} currently active
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Budget Spent
            </span>
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatPriceExact(totalSpentInKobo)}
          </p>
          <span className="font-mono text-xs text-muted-foreground">
            of {formatPriceExact(totalAllocatedInKobo)}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Budget Remaining
            </span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-primary">
            {formatPriceExact(
              Math.max(0, totalAllocatedInKobo - totalSpentInKobo)
            )}
          </p>
          <span className="text-xs text-muted-foreground">
            Available to subsidize
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold tracking-wider uppercase">
              Total Uses
            </span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {totalRedemptions}
          </p>
          <span className="text-xs text-muted-foreground">
            Order redemptions
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-6 border-b border-border text-sm">
        <button
          onClick={() => setActiveTab("promos")}
          className={`flex items-center gap-2 border-b-2 pb-3 font-semibold transition-colors ${
            activeTab === "promos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TicketPercent className="h-4 w-4" />
          <span>Promo Codes</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-normal">
            {promoList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("redemptions")}
          className={`flex items-center gap-2 border-b-2 pb-3 font-semibold transition-colors ${
            activeTab === "redemptions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Usage & Customer History</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-normal">
            {redemptionsList.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "promos" ? (
        promoList.length === 0 ? (
          <EmptyState
            icon={<TicketPercent className="h-10 w-10 text-primary" />}
            title="No Promo Codes Yet"
            description="Create your first marketing promo code to offer flat or percentage discounts to customers."
            action={{
              label: "Create Promo Code",
              onClick: () => router.push("/admin/promos/new"),
            }}
          />
        ) : (
          <PromoCodeTable promos={promoList} />
        )
      ) : isLoadingRedemptions ? (
        <PageSkeleton variant="admin-list" count={3} />
      ) : isErrorRedemptions ? (
        <FetchError
          title="Failed to Load Redemptions"
          message="Could not load promo redemption logs."
          onRetry={() => refetchRedemptions()}
        />
      ) : (
        <PromoRedemptionsTable redemptions={redemptionsList} />
      )}
    </div>
  )
}
