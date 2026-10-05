/**
 * gamificationService.ts
 *
 * Handles all logic for reward campaigns, tracking progress, and issuing vouchers.
 * Implements strict fintech protections like Mongoose transactions and atomic updates
 * to prevent double-spending and budget overruns during concurrent requests.
 */

import dbConnect from "@/lib/db"
import mongoose from "mongoose"
import Customer from "@/models/Customer"
import RewardCampaign, { IRewardCampaign } from "@/models/RewardCampaign"
import CampaignProgress from "@/models/CampaignProgress"
import RewardVoucher from "@/models/RewardVoucher"
import Wallet from "@/models/Wallet"
import WalletTransaction from "@/models/WalletTransaction"
import MenuItem from "@/models/MenuItem"
import crypto from "crypto"

// Helper to generate secure voucher codes
function generateVoucherCode(): string {
  // E.g., BITE-A8F9K2
  return `BITE-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
}

import {
  serializeRewardCampaign,
  serializeCampaignProgress,
  serializeRewardVoucher,
  serializeMenuItem,
} from "@/lib/serializers"
import { RewardCampaignFormValues } from "@/lib/schemas/admin"

/**
 * Triggered when a new user signs up with a referral code.
 */
export async function processReferralSignup(
  newCustomerId: string,
  referrerCode: string
) {
  await dbConnect()

  const referrer = await Customer.findOne({ referralCode: referrerCode })
  if (!referrer) return // Silent fail if invalid code

  const locationMatch = [
    { targetSchool: { $in: [null, ""] } },
    {
      targetSchool: referrer.school || "NO_MATCH",
      targetCampus: { $in: [null, ""] },
    },
    {
      targetSchool: referrer.school || "NO_MATCH",
      targetCampus: referrer.campus || "NO_MATCH",
    },
  ]

  const campaigns = await RewardCampaign.find({
    isActive: true,
    actionType: "REFERRAL_SIGNUP",
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
  })

  for (const campaign of campaigns) {
    await processCampaignProgress(referrer._id, campaign, newCustomerId)
  }
}

/**
 * Triggered when a customer's order is completed successfully.
 */
export async function processOrderCompleted(
  orderId: string,
  customerId: string,
  orderTotal: number
) {
  await dbConnect()

  const customer = await Customer.findById(customerId).lean()
  if (!customer) return

  const locationMatch = [
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

  // 1. Process ORDER_COMPLETED campaigns for the buyer
  const orderCampaigns = await RewardCampaign.find({
    isActive: true,
    actionType: "ORDER_COMPLETED",
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
  })

  for (const campaign of orderCampaigns) {
    if (campaign.minOrderValue && orderTotal < campaign.minOrderValue) continue
    // Use orderId as the unique entity to prevent double counting
    await processCampaignProgress(
      new mongoose.Types.ObjectId(customerId),
      campaign,
      orderId
    )
  }

  // 2. Process REFERRAL_FIRST_ORDER campaigns for the referrer
  if (customer.referredBy) {
    // Check if this is their very first order
    const previousOrders = await mongoose.models.Order.countDocuments({
      customerId: customer._id,
      status: "completed",
      orderId: { $ne: orderId },
    })

    if (previousOrders === 0) {
      const referrer = await Customer.findOne({
        referralCode: customer.referredBy,
      })
      if (referrer) {
        const referrerLocationMatch = [
          { targetSchool: { $in: [null, ""] } },
          {
            targetSchool: referrer.school || "NO_MATCH",
            targetCampus: { $in: [null, ""] },
          },
          {
            targetSchool: referrer.school || "NO_MATCH",
            targetCampus: referrer.campus || "NO_MATCH",
          },
        ]

        const referralCampaigns = await RewardCampaign.find({
          isActive: true,
          actionType: "REFERRAL_FIRST_ORDER",
          $and: [
            {
              $or: [
                { endDate: { $exists: false } },
                { endDate: null },
                { endDate: { $gt: new Date() } },
              ],
            },
            { $or: referrerLocationMatch },
          ],
        })

        for (const campaign of referralCampaigns) {
          if (campaign.minOrderValue && orderTotal < campaign.minOrderValue)
            continue
          await processCampaignProgress(referrer._id, campaign, orderId)
        }
      }
    }
  }
}

/**
 * Core engine to atomically process a user's progress toward a campaign.
 */
async function processCampaignProgress(
  customerId: mongoose.Types.ObjectId,
  campaign: IRewardCampaign,
  entityId: string // e.g. referredUserId or orderId to prevent double counting
) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // 1. Lock the progress document for this user & campaign
    const progress = await CampaignProgress.findOneAndUpdate(
      { customerId, campaignId: campaign._id },
      { $setOnInsert: { customerId, campaignId: campaign._id } },
      { upsert: true, new: true, session }
    )

    // Check if fully completed
    if (
      campaign.maxCompletionsPerUser > 0 &&
      progress.timesCompleted >= campaign.maxCompletionsPerUser
    ) {
      await session.abortTransaction()
      return
    }

    // Check if we already counted this specific entity (prevent double counting)
    if (progress.trackedEntityIds.includes(entityId)) {
      await session.abortTransaction()
      return
    }

    // Update progress
    progress.trackedEntityIds.push(entityId)
    progress.currentCount += 1

    let rewardTriggered = false

    // Check if target reached
    if (progress.currentCount >= campaign.targetCount) {
      rewardTriggered = true
      progress.currentCount = 0 // Reset for next round if applicable
      progress.timesCompleted += 1

      if (
        campaign.maxCompletionsPerUser > 0 &&
        progress.timesCompleted >= campaign.maxCompletionsPerUser
      ) {
        progress.isFullyCompleted = true
      }
    }

    await progress.save({ session })

    // If target reached, try to issue the reward atomically
    if (rewardTriggered) {
      // Find campaign again, but this time lock it for budgeting
      const lockedCampaign = await RewardCampaign.findOne(
        { _id: campaign._id, isActive: true },
        null,
        { session }
      )

      if (!lockedCampaign) {
        await session.abortTransaction()
        return // Campaign got deactivated
      }

      // Check Beneficiaries Limit
      if (
        lockedCampaign.maxBeneficiaries > 0 &&
        lockedCampaign.currentBeneficiaries >= lockedCampaign.maxBeneficiaries
      ) {
        await session.abortTransaction()
        return // Campaign is full
      }

      // We don't deduct budget strictly here for free meals because prices vary,
      // but we increment beneficiaries safely and deduct BHC cost instantly.
      lockedCampaign.currentBeneficiaries += 1
      if (campaign.rewardType === "BITEHUB_COINS" && campaign.rewardValue) {
        lockedCampaign.budgetSpent += campaign.rewardValue
      }
      await lockedCampaign.save({ session })

      // Issue Reward
      if (campaign.rewardType === "BITEHUB_COINS" && campaign.rewardValue) {
        await issueCoins(
          customerId.toString(),
          campaign.rewardValue,
          campaign.title,
          campaign.rewardExpiryDays ?? 90,
          session
        )
      } else if (campaign.rewardType === "FREE_MEAL") {
        await issueVoucher(
          customerId,
          campaign._id,
          campaign.vendorId!,
          campaign.menuItemId!,
          campaign.title,
          campaign.rewardExpiryDays ?? 90,
          session
        )
      }
    }

    await session.commitTransaction()
  } catch (error) {
    await session.abortTransaction()
    console.error("Gamification Error:", error)
  } finally {
    session.endSession()
  }
}

/**
 * Issues BiteHub coins securely via Wallet Transactions.
 */
async function issueCoins(
  customerId: string,
  amount: number,
  campaignTitle: string,
  expiryDays: number,
  session: mongoose.mongo.ClientSession
) {
  const wallet = await Wallet.findOneAndUpdate(
    { customerId },
    {
      $setOnInsert: {
        customerId,
        balance: 0,
        depositBalance: 0,
        promoBalance: 0,
      },
    },
    { upsert: true, new: true, session }
  )

  wallet.balance += amount
  wallet.promoBalance = (wallet.promoBalance || 0) + amount
  await wallet.save({ session })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  await WalletTransaction.create(
    [
      {
        customerId: customerId,
        type: "reward",
        direction: "credit",
        amount,
        balanceAfter: wallet.balance,
        expiresAt,
        isExpired: false,
        remainingAmount: amount,
        reference: `REWARD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
        description: `Reward for completing: ${campaignTitle}`,
      },
    ],
    { session }
  )

  const customer = await Customer.findById(customerId)
    .select("email name")
    .lean()
  if (customer && customer.email) {
    const { sendRewardEarnedEmail } = await import("@/lib/rewardMail")
    sendRewardEarnedEmail(
      customer.email,
      customer.name,
      campaignTitle,
      `${amount} BHC`
    ).catch(console.error)
  }
}

/**
 * Issues a cryptographically secure voucher for a free meal.
 */
async function issueVoucher(
  customerId: mongoose.Types.ObjectId,
  campaignId: mongoose.Types.ObjectId,
  vendorId: mongoose.Types.ObjectId,
  menuItemId: string,
  campaignTitle: string,
  expiryDays: number,
  session: mongoose.mongo.ClientSession
) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  await RewardVoucher.create(
    [
      {
        code: generateVoucherCode(),
        customerId,
        campaignId,
        vendorId,
        menuItemId,
        expiresAt,
      },
    ],
    { session }
  )

  const customer = await Customer.findById(customerId)
    .select("email name")
    .lean()
  if (customer && customer.email) {
    const { sendRewardEarnedEmail } = await import("@/lib/rewardMail")
    sendRewardEarnedEmail(
      customer.email,
      customer.name,
      campaignTitle,
      "Free Meal Voucher"
    ).catch(console.error)
  }
}

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
