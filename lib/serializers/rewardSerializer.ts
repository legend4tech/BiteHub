/**
 * rewardSerializer.ts
 *
 * Serializers for RewardCampaign, CampaignProgress, RewardVoucher, and GamificationFailureLog documents.
 * Normalizes _id to id, formats reward values, and handles nested populated entities.
 */

import type { Types } from "mongoose"
import type { GamificationFailureItem } from "@/types/admin"
import { LeanDoc, safeDate } from "./base"

export type LeanRewardCampaign = LeanDoc<
  import("@/models/RewardCampaign").IRewardCampaign
>
export type LeanCampaignProgress = LeanDoc<
  import("@/models/CampaignProgress").ICampaignProgress
>
export type LeanRewardVoucher = LeanDoc<
  import("@/models/RewardVoucher").IRewardVoucher
>
export type LeanGamificationFailureLog = LeanDoc<
  import("@/models/GamificationFailureLog").IGamificationFailureLog
>

export function serializeRewardCampaign(doc: LeanRewardCampaign | null) {
  if (!doc) return null
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description ?? null,
    actionType: doc.actionType,
    targetCount: doc.targetCount,
    minOrderValueInKobo: doc.minOrderValueInKobo ?? null,
    rewardType: doc.rewardType,
    rewardValueInKobo: doc.rewardValueInKobo ?? null,
    rewardExpiryDays: doc.rewardExpiryDays ?? 90,
    vendorId: doc.vendorId?.toString() ?? null,
    menuItemId: doc.menuItemId ?? null,
    maxBeneficiaries: doc.maxBeneficiaries,
    currentBeneficiaries: doc.currentBeneficiaries,
    budgetAllocatedInKobo: doc.budgetAllocatedInKobo,
    budgetSpentInKobo: doc.budgetSpentInKobo,
    isActive: doc.isActive,
    startDate: safeDate(doc.startDate),
    endDate: doc.endDate ? safeDate(doc.endDate) : null,
    targetSchool: doc.targetSchool ?? null,
    targetCampus: doc.targetCampus ?? null,
    maxCompletionsPerUser: doc.maxCompletionsPerUser,
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

export function serializeCampaignProgress(doc: LeanCampaignProgress | null) {
  if (!doc) return null
  return {
    id: doc._id.toString(),
    customerId: doc.customerId.toString(),
    campaignId: doc.campaignId.toString(),
    currentCount: doc.currentCount,
    timesCompleted: doc.timesCompleted,
    isFullyCompleted: doc.isFullyCompleted,
    trackedEntityIds: Array.isArray(doc.trackedEntityIds)
      ? doc.trackedEntityIds
      : [],
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

export function serializeRewardVoucher(doc: LeanRewardVoucher | null) {
  if (!doc) return null
  return {
    id: doc._id.toString(),
    code: doc.code,
    customerId: doc.customerId.toString(),
    campaignId: doc.campaignId.toString(),
    vendorId: doc.vendorId.toString(),
    menuItemId: doc.menuItemId,
    isUsed: doc.isUsed,
    usedAt: doc.usedAt ? safeDate(doc.usedAt) : null,
    usedOrderId: doc.usedOrderId ?? null,
    expiresAt: safeDate(doc.expiresAt),
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
  }
}

export function serializeGamificationFailureLog(
  doc:
    | (LeanGamificationFailureLog & {
        customerId?: unknown
        campaignId?: unknown
      })
    | null
): GamificationFailureItem | null {
  if (!doc) return null

  const cust =
    doc.customerId &&
    typeof doc.customerId === "object" &&
    "_id" in doc.customerId
      ? (doc.customerId as {
          _id: Types.ObjectId | string
          name?: string
          email?: string
          phone?: string
        })
      : null

  const camp =
    doc.campaignId &&
    typeof doc.campaignId === "object" &&
    "_id" in doc.campaignId
      ? (doc.campaignId as {
          _id: Types.ObjectId | string
          title?: string
          rewardType?: string
          rewardValueInKobo?: number | null
          vendorId?: Types.ObjectId | string | null
          menuItemId?: string | null
        })
      : null

  return {
    id: doc._id.toString(),
    orderId: doc.orderId ?? null,
    errorMessage: doc.errorMessage,
    errorStack: doc.errorStack ?? null,
    context: doc.context,
    resolved: Boolean(doc.resolved),
    createdAt: safeDate(doc.createdAt),
    updatedAt: safeDate(doc.updatedAt),
    customer: cust
      ? {
          id: cust._id.toString(),
          name: cust.name || "Unknown",
          email: cust.email || "",
          phone: cust.phone || "",
        }
      : null,
    campaign: camp
      ? {
          id: camp._id.toString(),
          title: camp.title || "Unknown Campaign",
          rewardType: camp.rewardType || "UNKNOWN",
          rewardValueInKobo: camp.rewardValueInKobo ?? null,
          vendorId: camp.vendorId ? camp.vendorId.toString() : null,
          menuItemId: camp.menuItemId ?? null,
        }
      : null,
  }
}
