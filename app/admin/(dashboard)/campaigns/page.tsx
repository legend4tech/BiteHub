"use client"

import { useState } from "react"
import {
  useCampaigns,
  useToggleCampaignStatus,
  useGamificationAnalytics,
} from "@/hooks/admin/useCampaigns"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { RewardCampaignFormValues } from "@/lib/schemas/admin"
import {
  Plus,
  Edit2,
  Activity,
  DollarSign,
  Target,
  Gift,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  Ticket,
  Clock,
} from "lucide-react"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"
import { motion } from "framer-motion"
import Link from "next/link"

export default function AdminCampaignsPage() {
  const { data: campaigns, isLoading, isError, refetch } = useCampaigns()
  const { data: analytics, isLoading: analyticsLoading } =
    useGamificationAnalytics()
  const { mutateAsync: toggleCampaign } = useToggleCampaignStatus()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = async (id: string, isActive: boolean) => {
    setTogglingId(id)
    try {
      await toggleCampaign(id)
      toast.success(`Campaign ${isActive ? "paused" : "resumed"} successfully`)
    } catch {
      toast.error("Failed to toggle campaign status")
    } finally {
      setTogglingId(null)
    }
  }

  const totalCampaigns = campaigns?.length || 0
  const activeCampaigns =
    campaigns?.filter(
      (c: RewardCampaignFormValues & { id: string }) => c.isActive
    ).length || 0
  const totalBudgetSpent =
    campaigns?.reduce(
      (acc: number, c: RewardCampaignFormValues & { budgetSpent: number }) =>
        acc + (c.budgetSpent || 0),
      0
    ) || 0

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gamification Campaigns
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage rewards, budgets, and milestones for customers.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full shadow-md">
          <Link href="/admin/campaigns/new">
            <Plus className="mr-2 size-5" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Analytics Cards */}
      {!isLoading && !analyticsLoading && (
        <div className="grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Target className="size-5" />
              </div>
              <p className="font-semibold text-muted-foreground">
                Total Campaigns
              </p>
            </div>
            <p className="mt-2 text-4xl font-black text-foreground">
              {totalCampaigns}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Activity className="size-5" />
              </div>
              <p className="font-semibold text-muted-foreground">
                Active Campaigns
              </p>
            </div>
            <p className="mt-2 text-4xl font-black text-foreground">
              {activeCampaigns}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
                <DollarSign className="size-5" />
              </div>
              <p className="font-semibold text-muted-foreground">
                Budget Spent
              </p>
            </div>
            <p className="mt-2 text-4xl font-black text-foreground">
              {formatPrice(totalBudgetSpent)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <DollarSign className="size-5" />
              </div>
              <p className="font-semibold text-muted-foreground">
                Total BHC Issued (All Time)
              </p>
            </div>
            <p className="mt-2 text-4xl font-black text-foreground">
              {formatPrice(analytics?.totalIssuedAllTime || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <TrendingUp className="size-5" />
              </div>
              <p className="font-semibold text-muted-foreground">
                Redemption Rate (All Time)
              </p>
            </div>
            <p className="mt-2 text-4xl font-black text-foreground">
              {analytics?.redemptionRate || 0}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
                <Ticket className="size-5" />
              </div>
              <p className="font-semibold text-muted-foreground">
                Free Meals Redeemed
              </p>
            </div>
            <p className="mt-2 text-4xl font-black text-foreground">
              {analytics?.vouchersUsedCount || 0}
            </p>
          </motion.div>
        </div>
      )}

      {isLoading ? (
        <PageSkeleton variant="admin-list" />
      ) : isError ? (
        <FetchError
          message="Failed to load campaigns."
          onRetry={() => refetch()}
        />
      ) : campaigns?.length === 0 ? (
        <EmptyState
          title="No campaigns running"
          description="Create your first gamification campaign to start rewarding your customers and driving engagement."
          size="lg"
          action={{
            label: "Create Campaign",
            icon: <Plus className="size-4" />,
            href: "/admin/campaigns/new",
          }}
          className="rounded-3xl border border-border bg-card shadow-sm"
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="p-5 font-semibold">Campaign</th>
                  <th className="p-5 font-semibold">Trigger</th>
                  <th className="p-5 font-semibold">Reward</th>
                  <th className="p-5 font-semibold">Budget (Alloc / Spent)</th>
                  <th className="p-5 font-semibold">Beneficiaries</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns?.map(
                  (
                    campaign: RewardCampaignFormValues & {
                      id: string
                      currentBeneficiaries: number
                      budgetSpent: number
                    }
                  ) => (
                    <tr
                      key={campaign.id}
                      className="transition-colors hover:bg-muted/10"
                    >
                      <td className="p-5">
                        <div className="font-bold text-foreground">
                          {campaign.title}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex w-fit items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                          <Target className="size-3.5" />
                          {campaign.actionType.replace(/_/g, " ")} (
                          {campaign.targetCount})
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 font-bold">
                            {campaign.rewardType === "BITEHUB_COINS" ? (
                              <span className="flex items-center gap-1.5 text-primary">
                                <DollarSign className="size-4" />{" "}
                                {campaign.rewardValue} BHC
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-primary">
                                <Gift className="size-4" /> Free Meal
                              </span>
                            )}
                          </div>
                          {campaign.rewardType === "BITEHUB_COINS" &&
                            campaign.rewardExpiryDays && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                Expires in {campaign.rewardExpiryDays} days
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-bold text-foreground">
                            {formatPrice(campaign.budgetAllocated)}
                          </span>
                          <span className="text-muted-foreground">
                            Spent: {formatPrice(campaign.budgetSpent)}
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-semibold text-foreground">
                          {campaign.currentBeneficiaries}{" "}
                          <span className="font-medium text-muted-foreground">
                            / {campaign.maxBeneficiaries}
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        {campaign.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                            <Activity className="size-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">
                            <PauseCircle className="size-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="hover:bg-primary/10 hover:text-primary"
                            title="Edit Campaign"
                          >
                            <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                              <Edit2 className="size-4" />
                            </Link>
                          </Button>
                          <ConfirmDialog
                            title={
                              campaign.isActive
                                ? "Pause Campaign"
                                : "Resume Campaign"
                            }
                            description={`Are you sure you want to ${campaign.isActive ? "pause" : "resume"} this campaign?`}
                            onConfirm={() =>
                              handleToggle(
                                campaign.id,
                                campaign.isActive || false
                              )
                            }
                            confirmText={campaign.isActive ? "Pause" : "Resume"}
                            isDestructive={campaign.isActive}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className={
                                  campaign.isActive
                                    ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    : "text-primary hover:bg-primary/10 hover:text-primary"
                                }
                                title={
                                  campaign.isActive
                                    ? "Pause Campaign"
                                    : "Resume Campaign"
                                }
                                disabled={togglingId === campaign.id}
                              >
                                {campaign.isActive ? (
                                  <PauseCircle className="size-5 stroke-[2.5]" />
                                ) : (
                                  <PlayCircle className="size-5 stroke-[2.5]" />
                                )}
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
