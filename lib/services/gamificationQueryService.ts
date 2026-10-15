/**
 * gamificationQueryService.ts
 *
 * Contains read-heavy queries and admin mutations for the gamification domain.
 * Extracted from gamificationService.ts to maintain the 450-line limit.
 */

import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"
import RewardCampaign from "@/models/RewardCampaign"
import CampaignProgress from "@/models/CampaignProgress"
import RewardVoucher from "@/models/RewardVoucher"
import MenuItem from "@/models/MenuItem"
import {
  serializeRewardCampaign,
  serializeCampaignProgress,
  serializeRewardVoucher,
  serializeMenuItem,
  serializeGamificationFailureLog,
} from "@/lib/serializers"
import type { RewardCampaignFormValues } from "@/lib/schemas/admin"
import type { GamificationFailureItem } from "@/types/admin"

// ── Admin Services ─────────────────────────────────────────────────────────────

export async function getAdminCampaigns() {
  await dbConnect()
  const campaigns = await RewardCampaign.find({}).sort({ createdAt: -1 }).lean()
  return campaigns.map(serializeRewardCampaign)
}

export async function createAdminCampaign(data: RewardCampaignFormValues) {
  await dbConnect()
  const campaign = await RewardCampaign.create(data)
  return serializeRewardCampaign(campaign.toObject())
}

export async function deactivateAdminCampaign(id: string) {
  await dbConnect()
  const campaign = await RewardCampaign.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).lean()
  return campaign
}

export async function toggleCampaignStatus(id: string) {
  await dbConnect()
  const campaign = await RewardCampaign.findById(id)
  if (!campaign) return null

  campaign.isActive = !campaign.isActive
  await campaign.save()

  return serializeRewardCampaign(campaign.toObject())
}

export async function updateAdminCampaign(
  id: string,
  data: Partial<RewardCampaignFormValues>
) {
  await dbConnect()
  const updatedCampaign = await RewardCampaign.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean()
  if (!updatedCampaign) return null

  return serializeRewardCampaign(updatedCampaign)
}

// ── Customer Services ──────────────────────────────────────────────────────────

export async function getCustomerCampaignProgress(customerId: string) {
  await dbConnect()
  const customer = await Customer.findById(customerId).lean()
  const progress = await CampaignProgress.find({ customerId }).lean()

  const locationMatch = customer
    ? [
        { targetSchool: { $in: [null, ""] } },
        {
          targetSchool: customer.school || "NO_MATCH",
          targetCampus: { $in: [null, ""] },
        },
        {
          targetSchool: customer.school || "NO_MATCH",
          targetCampus: customer.campus || "NO_MATCH",
        },
      ]
    : [{ targetSchool: { $in: [null, ""] } }]

  const activeCampaigns = await RewardCampaign.find({
    isActive: true,
    $and: [
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gt: new Date() } },
        ],
      },
      { $or: locationMatch },
    ],
  }).lean()

  return {
    progress: progress.map(serializeCampaignProgress),
    campaigns: activeCampaigns.map(serializeRewardCampaign),
  }
}

export async function getCustomerVouchers(customerId: string) {
  await dbConnect()
  const vouchers = await RewardVoucher.find({
    customerId,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean()

  const populatedVouchers = await Promise.all(
    vouchers.map(async (v) => {
      const menuItem = await MenuItem.findById(v.menuItemId).lean()
      const serializedVoucher = serializeRewardVoucher(v)
      return {
        ...serializedVoucher,
        menuItem: menuItem ? serializeMenuItem(menuItem) : null,
      }
    })
  )

  return { vouchers: populatedVouchers }
}

// ── Gamification Failure Logs Services ───────────────────────────────────────

export async function getGamificationFailures(
  resolved?: boolean
): Promise<GamificationFailureItem[]> {
  await dbConnect()
  const GamificationFailureLog = (
    await import("@/models/GamificationFailureLog")
  ).default
  const query: Record<string, unknown> = {}
  if (typeof resolved === "boolean") {
    query.resolved = resolved
  }
  const rawLogs = await GamificationFailureLog.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("customerId", "name email phone")
    .populate(
      "campaignId",
      "title rewardType rewardValueInKobo vendorId menuItemId"
    )
    .lean()

  return rawLogs
    .map(serializeGamificationFailureLog)
    .filter((log): log is GamificationFailureItem => Boolean(log))
}

export async function retryGamificationReward(
  failureId: string,
  adminEmail: string
) {
  await dbConnect()
  const GamificationFailureLog = (
    await import("@/models/GamificationFailureLog")
  ).default
  const Customer = (await import("@/models/Customer")).default
  const RewardCampaign = (await import("@/models/RewardCampaign")).default
  const CampaignProgress = (await import("@/models/CampaignProgress")).default
  const Wallet = (await import("@/models/Wallet")).default
  const WalletTransaction = (await import("@/models/WalletTransaction")).default
  const RewardVoucher = (await import("@/models/RewardVoucher")).default
  const mongoose = (await import("mongoose")).default

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      // 1. Atomically lock and claim the failure log within the transaction
      const lockedLog = await GamificationFailureLog.findOneAndUpdate(
        { _id: failureId, resolved: false },
        { $set: { resolved: true } },
        { session, new: true }
      )
      if (!lockedLog) {
        throw new Error(
          "This failure log has already been resolved or is currently being processed"
        )
      }

      if (!lockedLog.customerId || !lockedLog.campaignId) {
        throw new Error(
          "Cannot retry: failure log is missing customer or campaign reference"
        )
      }

      const customer = await Customer.findById(lockedLog.customerId).session(
        session
      )
      const campaign = await RewardCampaign.findById(
        lockedLog.campaignId
      ).session(session)

      if (!customer) throw new Error("Customer no longer exists")
      if (!campaign) throw new Error("Campaign no longer exists")

      // 2. Synchronize RewardCampaign metrics
      campaign.currentBeneficiaries = (campaign.currentBeneficiaries || 0) + 1
      if (
        campaign.rewardType === "BITEHUB_COINS" &&
        campaign.rewardValueInKobo
      ) {
        campaign.budgetSpentInKobo =
          (campaign.budgetSpentInKobo || 0) + campaign.rewardValueInKobo
      }
      await campaign.save({ session })

      // 3. Synchronize CampaignProgress so user cannot re-claim milestone
      const progress = await CampaignProgress.findOneAndUpdate(
        { customerId: customer._id, campaignId: campaign._id },
        {
          $setOnInsert: { customerId: customer._id, campaignId: campaign._id },
        },
        { upsert: true, new: true, session }
      )
      if (
        lockedLog.orderId &&
        !progress.trackedEntityIds.includes(lockedLog.orderId)
      ) {
        progress.trackedEntityIds.push(lockedLog.orderId)
      }
      progress.timesCompleted = (progress.timesCompleted || 0) + 1
      if (
        campaign.maxCompletionsPerUser > 0 &&
        progress.timesCompleted >= campaign.maxCompletionsPerUser
      ) {
        progress.isFullyCompleted = true
      }
      await progress.save({ session })

      // 4. Issue the actual reward
      const crypto = (await import("crypto")).default
      const expiryDays = campaign.rewardExpiryDays ?? 90
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)

      if (
        campaign.rewardType === "BITEHUB_COINS" &&
        campaign.rewardValueInKobo
      ) {
        const wallet = await Wallet.findOneAndUpdate(
          { customerId: customer._id },
          {
            $setOnInsert: {
              customerId: customer._id,
              balanceInKobo: 0,
              depositBalanceInKobo: 0,
              promoBalanceInKobo: 0,
            },
          },
          { upsert: true, new: true, session }
        )

        wallet.balanceInKobo += campaign.rewardValueInKobo
        wallet.promoBalanceInKobo =
          (wallet.promoBalanceInKobo || 0) + campaign.rewardValueInKobo
        await wallet.save({ session })

        await WalletTransaction.create(
          [
            {
              customerId: customer._id,
              type: "reward",
              direction: "credit",
              amountInKobo: campaign.rewardValueInKobo,
              balanceAfterInKobo: wallet.balanceInKobo,
              expiresAt,
              isExpired: false,
              remainingAmountInKobo: campaign.rewardValueInKobo,
              reference: `REWARD-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
              description: `Admin manual retry credit: ${campaign.title} (by ${adminEmail})`,
            },
          ],
          { session }
        )
      } else if (campaign.rewardType === "FREE_MEAL") {
        await RewardVoucher.create(
          [
            {
              code: `BITE-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
              customerId: customer._id,
              campaignId: campaign._id,
              vendorId: campaign.vendorId,
              menuItemId: campaign.menuItemId,
              expiresAt,
            },
          ],
          { session }
        )
      }
    })
  } finally {
    session.endSession()
  }

  return { success: true }
}

export async function dismissGamificationFailure(failureId: string) {
  await dbConnect()
  const GamificationFailureLog = (
    await import("@/models/GamificationFailureLog")
  ).default
  const log = await GamificationFailureLog.findByIdAndUpdate(
    failureId,
    { $set: { resolved: true } },
    { new: true }
  ).lean()

  if (!log) throw new Error("Failure log not found")
  return { success: true }
}
