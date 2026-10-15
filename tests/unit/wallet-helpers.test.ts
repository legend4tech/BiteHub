import { describe, it, expect, vi, beforeEach } from "vitest"
import mongoose from "mongoose"
import { processWalletPaymentDeduction } from "@/lib/services/checkoutWalletHelpers"
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants"

// Mock models
const mockWallet = {
  findOne: vi.fn(),
}

const mockWalletTransaction = {
  find: vi.fn(),
  create: vi.fn(),
}

const mockVendor = {
  findByIdAndUpdate: vi.fn(),
}

vi.mock("@/models/Wallet", () => ({
  default: mockWallet,
}))

vi.mock("@/models/WalletTransaction", () => ({
  default: mockWalletTransaction,
}))

vi.mock("@/models/Vendor", () => ({
  default: mockVendor,
}))

describe("processWalletPaymentDeduction", () => {
  const customerId = new mongoose.Types.ObjectId().toString()
  const orderId = "ORD-TEST-1234"
  const vendorId = new mongoose.Types.ObjectId().toString()
  const mockSession = {} as unknown as mongoose.ClientSession

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("throws 'Insufficient balance' if lockedWallet is not found", async () => {
    mockWalletTransaction.find.mockReturnValue({
      session: vi.fn().mockResolvedValue([]),
    })
    mockWallet.findOne.mockReturnValue({
      session: vi.fn().mockResolvedValue(null),
    })

    const mockOrder = { save: vi.fn() } as unknown as mongoose.Document

    await expect(
      processWalletPaymentDeduction(
        { _id: customerId },
        5000,
        true,
        orderId,
        vendorId,
        4500,
        mockOrder,
        mockSession,
        5000
      )
    ).rejects.toThrow("Insufficient balance")
  })

  it("correctly deducts full amount from deposit when useBHC is false", async () => {
    const fakeWallet = {
      customerId,
      balanceInKobo: 10000,
      depositBalanceInKobo: 10000,
      promoBalanceInKobo: 2000,
      save: vi.fn().mockResolvedValue(true),
    }

    mockWalletTransaction.find.mockReturnValue({
      session: vi.fn().mockResolvedValue([]),
    })
    mockWallet.findOne.mockReturnValue({
      session: vi.fn().mockResolvedValue(fakeWallet),
    })
    mockWalletTransaction.create.mockResolvedValue([])
    mockVendor.findByIdAndUpdate.mockResolvedValue({})

    const mockOrder: Record<string, unknown> = {
      save: vi.fn().mockResolvedValue(true),
    }

    await processWalletPaymentDeduction(
      { _id: customerId },
      4000,
      false, // useBHC is false
      orderId,
      vendorId,
      3600,
      mockOrder as unknown as mongoose.Document,
      mockSession,
      3000
    )

    // Deposit balance should decrease by 4000
    expect(fakeWallet.depositBalanceInKobo).toBe(6000)
    // Promo balance untouched
    expect(fakeWallet.promoBalanceInKobo).toBe(2000)
    // Total balance decreased by 4000
    expect(fakeWallet.balanceInKobo).toBe(6000)
    expect(fakeWallet.save).toHaveBeenCalled()

    // Order record updated
    expect(mockOrder.walletPromoAmountUsedInKobo).toBe(0)
    expect(mockOrder.walletDepositAmountUsedInKobo).toBe(4000)
    expect(mockOrder.status).toBe(ORDER_STATUS.CONFIRMED)
    expect(mockOrder.paymentStatus).toBe(PAYMENT_STATUS.PAID)
    expect(mockOrder.save).toHaveBeenCalled()

    // Vendor pending balance incremented
    expect(mockVendor.findByIdAndUpdate).toHaveBeenCalledWith(
      vendorId,
      { $inc: { pendingWalletBalanceInKobo: 3600 } },
      { session: mockSession }
    )
  })

  it("clamps promo deduction to itemSubtotalInKobo when useBHC is true", async () => {
    // Total order: 6000 Kobo (item: 3500 Kobo, delivery/service: 2500 Kobo)
    // Customer has 5000 promo coins and 10000 deposit coins
    // Promo deduction must NOT exceed 3500 (cannot cover delivery)
    const fakeWallet = {
      customerId,
      balanceInKobo: 15000,
      depositBalanceInKobo: 10000,
      promoBalanceInKobo: 5000,
      save: vi.fn().mockResolvedValue(true),
    }

    const mockActiveReward = {
      remainingAmountInKobo: 5000,
      isExpired: false,
      save: vi.fn().mockResolvedValue(true),
    }

    // Lazy expiry finds no expired rewards
    mockWalletTransaction.find.mockReturnValueOnce({
      session: vi.fn().mockResolvedValue([]),
    })
    mockWallet.findOne.mockReturnValue({
      session: vi.fn().mockResolvedValue(fakeWallet),
    })

    // Active rewards for FIFO
    mockWalletTransaction.find.mockReturnValueOnce({
      sort: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue([mockActiveReward]),
      }),
    })
    mockWalletTransaction.create.mockResolvedValue([])
    mockVendor.findByIdAndUpdate.mockResolvedValue({})

    const mockOrder: Record<string, unknown> = {
      save: vi.fn().mockResolvedValue(true),
    }

    await processWalletPaymentDeduction(
      { _id: customerId },
      6000,
      true, // useBHC = true
      orderId,
      vendorId,
      3500,
      mockOrder as unknown as mongoose.Document,
      mockSession,
      3500 // itemSubtotalInKobo
    )

    // Clamped promo deduction: 3500 Kobo
    expect(mockOrder.walletPromoAmountUsedInKobo).toBe(3500)
    // Deposit deduction: 6000 - 3500 = 2500 Kobo
    expect(mockOrder.walletDepositAmountUsedInKobo).toBe(2500)

    expect(fakeWallet.promoBalanceInKobo).toBe(1500)
    expect(fakeWallet.depositBalanceInKobo).toBe(7500)
    expect(fakeWallet.balanceInKobo).toBe(9000)

    // FIFO deduction on reward
    expect(mockActiveReward.remainingAmountInKobo).toBe(1500)
    expect(mockActiveReward.isExpired).toBe(false)
    expect(mockActiveReward.save).toHaveBeenCalled()
  })

  it("handles FIFO deduction across multiple reward batches in order of expiry", async () => {
    const fakeWallet = {
      customerId,
      balanceInKobo: 10000,
      depositBalanceInKobo: 6000,
      promoBalanceInKobo: 4000,
      save: vi.fn().mockResolvedValue(true),
    }

    // Batch 1: 1500 Kobo (expiring sooner)
    const rewardBatch1 = {
      remainingAmountInKobo: 1500,
      isExpired: false,
      save: vi.fn().mockResolvedValue(true),
    }
    // Batch 2: 2500 Kobo (expiring later)
    const rewardBatch2 = {
      remainingAmountInKobo: 2500,
      isExpired: false,
      save: vi.fn().mockResolvedValue(true),
    }

    mockWalletTransaction.find.mockReturnValueOnce({
      session: vi.fn().mockResolvedValue([]),
    })
    mockWallet.findOne.mockReturnValue({
      session: vi.fn().mockResolvedValue(fakeWallet),
    })
    // Mock sort by expiresAt returning batch1 then batch2
    mockWalletTransaction.find.mockReturnValueOnce({
      sort: vi.fn().mockReturnValue({
        session: vi.fn().mockResolvedValue([rewardBatch1, rewardBatch2]),
      }),
    })
    mockWalletTransaction.create.mockResolvedValue([])
    mockVendor.findByIdAndUpdate.mockResolvedValue({})

    const mockOrder: Record<string, unknown> = {
      save: vi.fn().mockResolvedValue(true),
    }

    // Deduct 2500 promo coins
    await processWalletPaymentDeduction(
      { _id: customerId },
      3000,
      true,
      orderId,
      vendorId,
      2700,
      mockOrder as unknown as mongoose.Document,
      mockSession,
      2500
    )

    // Batch 1 should be completely consumed (1500) and marked expired
    expect(rewardBatch1.remainingAmountInKobo).toBe(0)
    expect(rewardBatch1.isExpired).toBe(true)

    // Batch 2 should be partially consumed (1000 of 2500 remaining)
    expect(rewardBatch2.remainingAmountInKobo).toBe(1500)
    expect(rewardBatch2.isExpired).toBe(false)
  })

  it("lazily expires old rewards and rejects order if balance drops below total", async () => {
    const fakeWallet = {
      customerId,
      balanceInKobo: 5000,
      depositBalanceInKobo: 2000,
      promoBalanceInKobo: 3000,
      save: vi.fn().mockResolvedValue(true),
    }

    // Expired reward of 3000 Kobo
    const expiredReward = {
      remainingAmountInKobo: 3000,
      isExpired: false,
      save: vi.fn().mockResolvedValue(true),
    }

    // Lazy expiry query returns the expired reward
    mockWalletTransaction.find.mockReturnValueOnce({
      session: vi.fn().mockResolvedValue([expiredReward]),
    })
    mockWallet.findOne.mockReturnValue({
      session: vi.fn().mockResolvedValue(fakeWallet),
    })

    const mockOrder: Record<string, unknown> = { save: vi.fn() }

    // Attempting to pay 4000 Kobo when 3000 promo coins have expired
    // Remaining valid balance will be only 2000 deposit coins < 4000 total
    await expect(
      processWalletPaymentDeduction(
        { _id: customerId },
        4000,
        true,
        orderId,
        vendorId,
        3600,
        mockOrder as unknown as mongoose.Document,
        mockSession,
        4000
      )
    ).rejects.toThrow("Insufficient balance")

    expect(expiredReward.isExpired).toBe(true)
    expect(expiredReward.remainingAmountInKobo).toBe(0)
    expect(fakeWallet.promoBalanceInKobo).toBe(0)
    expect(fakeWallet.balanceInKobo).toBe(2000)
  })
})
