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
import crypto from "crypto"
// Helper to generate secure voucher codes with high entropy
function generateVoucherCode(): string {
  // E.g., BITE-A8F9K2B3C4
  return `BITE-${crypto.randomBytes(5).toString("hex").toUpperCase()}`
}
import {} from "@/lib/serializers"
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
  orderTotalInKobo: number
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
    if (
      campaign.minOrderValueInKobo &&
      orderTotalInKobo < campaign.minOrderValueInKobo
    )
      continue
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
          if (
            campaign.minOrderValueInKobo &&
            orderTotalInKobo < campaign.minOrderValueInKobo
          )
            continue
          await processCampaignProgress(
            referrer._id,
            campaign,
            customer._id.toString()
          )
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
      // Check Budget Limit for BHC
      if (
        campaign.rewardType === "BITEHUB_COINS" &&
        campaign.rewardValueInKobo &&
        lockedCampaign.budgetAllocatedInKobo > 0 &&
        lockedCampaign.budgetSpentInKobo + campaign.rewardValueInKobo >
          lockedCampaign.budgetAllocatedInKobo
      ) {
        await session.abortTransaction()
        return // Campaign budget exhausted
      }
      // We don't deduct budget strictly here for free meals because prices vary,
      // but we increment beneficiaries safely and deduct BHC cost instantly.
      lockedCampaign.currentBeneficiaries += 1
      if (
        campaign.rewardType === "BITEHUB_COINS" &&
        campaign.rewardValueInKobo
      ) {
        lockedCampaign.budgetSpentInKobo += campaign.rewardValueInKobo
      }
      await lockedCampaign.save({ session })
      // Issue Reward
      if (
        campaign.rewardType === "BITEHUB_COINS" &&
        campaign.rewardValueInKobo
      ) {
        await issueCoins(
          customerId.toString(),
          campaign.rewardValueInKobo,
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
    console.error("Gamification Error in processCampaignProgress:", error)
    try {
      const err = error as Error
      const { default: GamificationFailureLog } =
        await import("@/models/GamificationFailureLog")
      await GamificationFailureLog.create({
        customerId,
        campaignId: campaign._id,
        errorMessage: err.message || "Unknown error",
        errorStack: err.stack,
        context: `processCampaignProgress (campaign: ${campaign.title}, entity: ${entityId})`,
      })
    } catch (logErr) {
      console.error("Failed to write to GamificationFailureLog:", logErr)
    }
  } finally {
    session.endSession()
  }
}
/**
 * Issues BiteHub coins securely via Wallet Transactions.
 */
async function issueCoins(
  customerId: string,
  amountInKobo: number,
  campaignTitle: string,
  expiryDays: number,
  session: mongoose.mongo.ClientSession
) {
  const wallet = await Wallet.findOneAndUpdate(
    { customerId },
    {
      $setOnInsert: {
        customerId,
        balanceInKobo: 0,
        depositBalanceInKobo: 0,
        promoBalanceInKobo: 0,
      },
    },
    { upsert: true, new: true, session }
  )
  wallet.balanceInKobo += amountInKobo
  wallet.promoBalanceInKobo = (wallet.promoBalanceInKobo || 0) + amountInKobo
  await wallet.save({ session })
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)
  await WalletTransaction.create(
    [
      {
        customerId: customerId,
        type: "reward",
        direction: "credit",
        amountInKobo,
        balanceAfterInKobo: wallet.balanceInKobo,
        expiresAt,
        isExpired: false,
        remainingAmountInKobo: amountInKobo,
        reference: `REWARD-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
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
    const { toMajorUnit } = await import("@/lib/money")
    sendRewardEarnedEmail(
      customer.email,
      customer.name,
      campaignTitle,
      `${toMajorUnit(amountInKobo)} BHC`
    ).catch(console.error)
  }
}
/**
 * Issues a cryptographically secure voucher for a free meal with collision retry.
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
  let voucherCreated = false
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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
      voucherCreated = true
      break
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 11000 && attempt < 2) {
        continue
      }
      throw err
    }
  }
  if (!voucherCreated) {
    throw new Error("Failed to generate a unique voucher code")
  }
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
