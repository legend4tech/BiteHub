import { auth } from "@/auth"

import mongoose from "mongoose"
import dbConnect from "@/lib/db"
import Image from "next/image"
import Link from "next/link"
import {
  Gift,
  Coins,
  Trophy,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { WhotCardStack } from "@/components/customer/rewards/WhotCardStack"
import { MilestonesProgress } from "@/components/customer/rewards/MilestonesProgress"
import { ReferralCard } from "@/components/customer/rewards/ReferralCard"
import { UserRankBadge } from "@/components/customer/rewards/UserRankBadge"
import {
  getCustomerReferralCode,
  getCustomerWalletData,
} from "@/lib/services/customerService"
import { ExpiringRewardsBanner } from "@/components/customer/rewards/ExpiringRewardsBanner"

export default async function CustomerRewardsPage() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  const referralCode = await getCustomerReferralCode(session.user.email)
  const { wallet, expiringRewards } = await getCustomerWalletData(
    session.user.id
  )
  const availableCoins = wallet?.promoBalance || 0

  await dbConnect()
  const WalletTransaction = (await import("@/models/WalletTransaction")).default

  const earnedAgg = await WalletTransaction.aggregate([
    {
      $match: {
        customerId: new mongoose.Types.ObjectId(session.user.id),
        type: "reward",
        direction: "credit",
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ])

  const lifetimeEarned = earnedAgg[0]?.total || 0
  const lifetimeSpent = Math.max(0, lifetimeEarned - availableCoins)

  const rewardTransactionsRaw = await WalletTransaction.find({
    customerId: new mongoose.Types.ObjectId(session.user.id),
    type: "reward",
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  const { serializeWalletTransaction } = await import("@/lib/serializers")
  const rewardHistory = rewardTransactionsRaw
    .map(serializeWalletTransaction)
    .filter(Boolean) as import("@/types/customer").Transaction[]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center md:gap-0">
        <div className="relative z-20 flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            Loyalty Program
          </div>
          <div className="pr-24 md:pr-0">
            <h1 className="font-heading text-3xl font-black tracking-tight text-foreground">
              Rewards & Coins
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Participate in active campaigns to earn BiteHub Coins and free
              meals. Check the milestones below to unlock your next reward!
            </p>
          </div>
        </div>

        {/* Fun Mascot Element */}
        <div className="pointer-events-none absolute -top-16 right-12 z-50 size-32 animate-[bounce_3s_infinite] md:relative md:top-auto md:right-auto md:size-48 md:shrink-0 md:pr-4">
          <Image
            src="/avatars/header_mascot.png"
            alt="Rewards Mascot"
            fill
            className="object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Top Section: Balance Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 shadow-sm">
        <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="size-48 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-0">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2 text-primary">
                  <Coins className="size-6" />
                </div>
                <p className="font-semibold text-foreground">Available Coins</p>
              </div>
              <UserRankBadge coins={availableCoins} />
            </div>
            <h2 className="flex items-baseline gap-2 text-5xl font-black tracking-tight">
              {availableCoins}{" "}
              <span className="text-2xl font-bold text-muted-foreground">
                BHC
              </span>
            </h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              1 BHC = ₦1. Join active campaigns to score coins and level up!
            </p>
            <div className="mt-4 max-w-sm">
              <ExpiringRewardsBanner rewards={expiringRewards} />
            </div>
          </div>

          <div className="mt-8 flex w-full gap-3 lg:mt-0 lg:w-auto lg:gap-4">
            <div className="min-w-0 flex-1 rounded-2xl border border-border bg-background/80 p-4 backdrop-blur-sm lg:min-w-[140px] lg:p-5">
              <p className="mb-1 truncate text-[10px] font-semibold text-muted-foreground uppercase md:text-xs">
                Lifetime Earned
              </p>
              <p className="text-xl font-bold text-foreground md:text-2xl">
                {lifetimeEarned}
              </p>
            </div>
            <div className="min-w-0 flex-1 rounded-2xl border border-border bg-background/80 p-4 backdrop-blur-sm lg:min-w-[140px] lg:p-5">
              <p className="mb-1 truncate text-[10px] font-semibold text-muted-foreground uppercase md:text-xs">
                Lifetime Spent
              </p>
              <p className="text-xl font-bold text-foreground md:text-2xl">
                {lifetimeSpent}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Gamification vs Actions */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Gamification Hub */}
        <div className="space-y-8">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Gift className="size-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                My Reward Vouchers
              </h2>
            </div>
            <WhotCardStack />
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Milestones</h2>
            </div>
            <MilestonesProgress />
          </div>
        </div>

        {/* Right Column: Referral & How to Earn */}
        <div className="space-y-8">
          {referralCode && <ReferralCard referralCode={referralCode} />}

          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Gift className="size-5" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">
                How to Earn
              </h3>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              BiteHub Rewards are fully dynamic! Keep an eye on the{" "}
              <strong>Milestones</strong> and{" "}
              <strong>My Reward Vouchers</strong> sections to your left.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We frequently launch new ways for you to earn BiteHub Coins (BHC)
              and Free Meals—such as referring friends, hitting order
              milestones, or leaving verified reviews.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
              <Trophy className="size-4" />
              Complete active campaigns to win!
            </div>
          </div>
        </div>
      </div>

      {/* Reward History */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-foreground">
            Recent Reward History
          </h2>
          {rewardHistory.length > 0 && (
            <Link
              href="/customer/transactions"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {rewardHistory.length === 0 ? (
          <EmptyState
            title="No history yet"
            description="Start ordering your favorite meals to earn coins. Your reward history will appear here."
            className="rounded-3xl border border-border bg-card shadow-sm"
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            {rewardHistory.map((tx, i) => {
              const isCredit = tx.direction === "credit"
              return (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-4 ${
                    i !== 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-lg p-2 ${
                        isCredit
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="size-5" />
                      ) : (
                        <ArrowUpRight className="size-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()} • Ref:{" "}
                        {tx.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        isCredit ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {tx.amount} BHC
                    </p>
                    <span className="inline-flex items-center justify-center rounded-full bg-accent px-2 py-0.5 text-center text-[10px] font-medium whitespace-nowrap text-foreground uppercase">
                      REWARD
                    </span>
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
