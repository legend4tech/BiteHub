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
} from "@/lib/serializers"
import type { RewardCampaignFormValues } from "@/lib/schemas/admin"

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
