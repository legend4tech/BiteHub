"use client"

import { useCustomerProgress } from "@/hooks/customer/useCustomerProgress"
import { Progress } from "@/components/ui/progress"
import { Clock } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export function MilestonesProgress() {
  const { data, isLoading } = useCustomerProgress()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-2xl bg-muted/50"></div>
        <div className="h-20 animate-pulse rounded-2xl bg-muted/50"></div>
      </div>
    )
  }

  if (!data?.campaigns || data.campaigns.length === 0) {
    return (
      <EmptyState
        title="No Milestones"
        description="No active milestones at the moment."
        size="sm"
        className="py-6"
      />
    )
  }

  return (
    <div className="grid max-h-[420px] gap-4 overflow-y-auto pr-2">
      {data.campaigns.map(
        (campaign: {
          id: string
          targetCount: number
          title: string
          description?: string
          endDate?: string
          maxCompletionsPerUser: number
        }) => {
          const prog = data.progress?.find(
            (p: {
              campaignId: string
              currentCount: number
              isFullyCompleted: boolean
              timesCompleted: number
            }) => p.campaignId === campaign.id
          )

          const currentCount = prog?.currentCount || 0
          const isFullyCompleted = prog?.isFullyCompleted || false
          const timesCompleted = prog?.timesCompleted || 0
          const percent = Math.min(
            (currentCount / campaign.targetCount) * 100,
            100
          )

          return (
            <div
              key={campaign.id}
              className="rounded-2xl border bg-card p-4 transition-all hover:shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold">{campaign.title}</h3>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {campaign.description ||
                      "Keep going to unlock your reward!"}
                  </p>
                </div>
                {isFullyCompleted ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-primary uppercase">
                    Completed
                  </span>
                ) : timesCompleted > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-primary uppercase">
                    Completed x{timesCompleted}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-1.5">
                {campaign.maxCompletionsPerUser > 0 && (
                  <div className="mb-2 flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>Claim Limit</span>
                    <span className="font-bold text-foreground">
                      {timesCompleted} / {campaign.maxCompletionsPerUser}{" "}
                      claimed
                    </span>
                  </div>
                )}

                {campaign.targetCount > 1 ? (
                  <>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">
                        {timesCompleted > 0 && !isFullyCompleted
                          ? "Next Reward Target"
                          : "Progress"}
                      </span>
                      <span className="text-primary">
                        {currentCount} / {campaign.targetCount}
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </>
                ) : (
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 text-center text-xs font-medium text-muted-foreground">
                    {timesCompleted > 0
                      ? `You've claimed this reward ${timesCompleted} time${timesCompleted === 1 ? "" : "s"}!`
                      : campaign.maxCompletionsPerUser > 0
                        ? "Complete this action to claim your reward."
                        : "Earn this reward every time you complete the action!"}
                  </div>
                )}
              </div>

              {campaign.endDate && (
                <div className="mt-3 flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground">
                  <Clock className="size-3" />
                  Ends {new Date(campaign.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )
        }
      )}
    </div>
  )
}
