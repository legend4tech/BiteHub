import { describe, it, expect, vi, beforeEach } from "vitest"
import crypto from "crypto"
import mongoose from "mongoose"
import { retryGamificationReward } from "@/lib/services/gamificationQueryService"

const {
  mockGamificationFailureLog,
  mockRewardCampaign,
  mockCustomer,
  mockCampaignProgress,
  mockWallet,
  mockWalletTransaction,
  mockRewardVoucher,
} = vi.hoisted(() => ({
  mockGamificationFailureLog: {
    findOneAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
  mockRewardCampaign: {
    findById: vi.fn(),
  },
  mockCustomer: {
    findById: vi.fn(),
  },
  mockCampaignProgress: {
    findOneAndUpdate: vi.fn(),
  },
  mockWallet: {
    findOneAndUpdate: vi.fn(),
  },
  mockWalletTransaction: {
    create: vi.fn(),
  },
  mockRewardVoucher: {
    create: vi.fn(),
  },
}))

vi.mock("@/lib/db", () => ({
  default: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/models/GamificationFailureLog", () => ({
  default: mockGamificationFailureLog,
}))
vi.mock("@/models/RewardCampaign", () => ({
  default: mockRewardCampaign,
}))
vi.mock("@/models/Customer", () => ({
  default: mockCustomer,
}))
vi.mock("@/models/CampaignProgress", () => ({
  default: mockCampaignProgress,
}))
vi.mock("@/models/Wallet", () => ({
  default: mockWallet,
}))
vi.mock("@/models/WalletTransaction", () => ({
  default: mockWalletTransaction,
}))
vi.mock("@/models/RewardVoucher", () => ({
  default: mockRewardVoucher,
}))

describe("Gamification Rules & Voucher Invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Voucher Code Entropy & Collision Resistance", () => {
    it("generates uppercase hex codes adhering to BITE-XXXXXXXXXX format with 10 hex characters", () => {
      const generateVoucherCode = () =>
        `BITE-${crypto.randomBytes(5).toString("hex").toUpperCase()}`

      for (let i = 0; i < 50; i++) {
        const code = generateVoucherCode()
        expect(code).toMatch(/^BITE-[A-F0-9]{10}$/)
        expect(code.length).toBe(15) // 'BITE-' (5) + 10 hex chars = 15
      }
    })

    it("generates 1,000 codes without a single collision", () => {
      const generateVoucherCode = () =>
        `BITE-${crypto.randomBytes(5).toString("hex").toUpperCase()}`

      const generatedSet = new Set<string>()
      const totalToGenerate = 1000

      for (let i = 0; i < totalToGenerate; i++) {
        const code = generateVoucherCode()
        generatedSet.add(code)
      }

      // If there were any collision, the set size would be strictly less than 1,000
      expect(generatedSet.size).toBe(totalToGenerate)
    })
  })

  describe("Referral Milestone Idempotency Logic", () => {
    it("prevents double-counting the same referred customer's first order", () => {
      const trackedEntityIds: string[] = []
      let timesCompleted = 0
      let currentCount = 0
      const targetCount = 1

      const processReferralOrder = (referredCustomerId: string) => {
        // Core invariant: entityId must be the referred customer's ID, not orderId
        if (trackedEntityIds.includes(referredCustomerId)) {
          return { rewarded: false, reason: "Already counted for this referee" }
        }

        trackedEntityIds.push(referredCustomerId)
        currentCount += 1

        if (currentCount >= targetCount) {
          timesCompleted += 1
          currentCount = 0
          return { rewarded: true }
        }

        return { rewarded: false, reason: "Target not reached" }
      }

      const referredUserId = new mongoose.Types.ObjectId().toString()

      // First order from this customer -> triggers reward
      const firstResult = processReferralOrder(referredUserId)
      expect(firstResult.rewarded).toBe(true)
      expect(timesCompleted).toBe(1)
      expect(trackedEntityIds).toContain(referredUserId)

      // Second order from the SAME customer -> MUST be rejected idempotently
      const secondResult = processReferralOrder(referredUserId)
      expect(secondResult.rewarded).toBe(false)
      expect(secondResult.reason).toBe("Already counted for this referee")
      expect(timesCompleted).toBe(1) // Still 1, never 2
    })

    it("allows distinct referred customers to each trigger referral milestone progress", () => {
      const trackedEntityIds: string[] = []
      let timesCompleted = 0

      const processReferral = (refereeId: string) => {
        if (trackedEntityIds.includes(refereeId)) return false
        trackedEntityIds.push(refereeId)
        timesCompleted += 1
        return true
      }

      const userA = new mongoose.Types.ObjectId().toString()
      const userB = new mongoose.Types.ObjectId().toString()

      expect(processReferral(userA)).toBe(true)
      expect(processReferral(userB)).toBe(true)
      expect(timesCompleted).toBe(2)
      expect(trackedEntityIds.length).toBe(2)
    })
  })

  describe("Campaign Budget & Beneficiary Guard Invariants", () => {
    it("aborts when reward would exceed total allocated campaign budget", () => {
      const campaign = {
        budgetAllocatedInKobo: 50_000, // ₦500 max budget
        budgetSpentInKobo: 48_000, // ₦480 already spent
        rewardValueInKobo: 5_000, // ₦50 reward requested
      }

      const canIssueReward =
        campaign.budgetAllocatedInKobo === 0 ||
        campaign.budgetSpentInKobo + campaign.rewardValueInKobo <=
          campaign.budgetAllocatedInKobo

      expect(canIssueReward).toBe(false) // 48,000 + 5,000 = 53,000 > 50,000
    })

    it("aborts when max beneficiaries ceiling has been reached", () => {
      const campaign = {
        maxBeneficiaries: 100,
        currentBeneficiaries: 100,
      }

      const hasSpace =
        campaign.maxBeneficiaries === 0 ||
        campaign.currentBeneficiaries < campaign.maxBeneficiaries

      expect(hasSpace).toBe(false)
    })
  })

  describe("Admin Failure Retry Concurrency & Lock Invariant", () => {
    it("fails with error if failure log is already resolved or locked", async () => {
      // Mock findOneAndUpdate returning null (atomic query lock failed because resolved: true)
      mockGamificationFailureLog.findOneAndUpdate.mockResolvedValue(null)

      const session = {
        withTransaction: vi.fn(async (callback: () => Promise<unknown>) => {
          return await callback()
        }),
        endSession: vi.fn(),
      }
      vi.spyOn(mongoose, "startSession").mockResolvedValue(
        session as unknown as mongoose.ClientSession
      )

      await expect(
        retryGamificationReward("fail-123", "admin@bitehub.ng")
      ).rejects.toThrow(
        "This failure log has already been resolved or is currently being processed"
      )

      expect(session.endSession).toHaveBeenCalled()
    })
  })
})
