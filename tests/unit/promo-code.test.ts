import { describe, it, expect, vi, beforeEach } from "vitest"
import mongoose from "mongoose"
import {
  validatePromoCode,
  redeemPromoCode,
} from "@/lib/services/promoCodeService"
import { createPromoCodeSchema, promoCodeFormInputSchema } from "@/lib/schemas"

const { mockPromoCode, mockPromoCodeRedemption } = vi.hoisted(() => ({
  mockPromoCode: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
  mockPromoCodeRedemption: {
    countDocuments: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock("@/lib/db", () => ({
  default: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/models/PromoCode", () => ({
  default: mockPromoCode,
}))

vi.mock("@/models/PromoCodeRedemption", () => ({
  default: mockPromoCodeRedemption,
}))

describe("Promo Code Engine Invariant Tests", () => {
  const sampleVendorId = new mongoose.Types.ObjectId().toString()
  const sampleCustomerId = new mongoose.Types.ObjectId().toString()
  const samplePromoId = new mongoose.Types.ObjectId()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should successfully validate an unrestricted flat-discount promo code", async () => {
    const mockPromoDoc = {
      _id: samplePromoId,
      code: "LAUNCH300",
      title: "Launch Special",
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 30000, // ₦300
      budgetAllocatedInKobo: 1000000, // ₦10,000
      budgetSpentInKobo: 0,
      currentRedemptions: 0,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
      startDate: new Date(Date.now() - 3600_000),
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })
    mockPromoCodeRedemption.countDocuments.mockResolvedValue(0)

    const result = await validatePromoCode({
      code: "launch300", // Case insensitivity check
      customerId: sampleCustomerId,
      vendorId: sampleVendorId,
      items: [{ menuItemId: "item-1", priceInKobo: 200000, quantity: 1 }],
    })

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.code).toBe("LAUNCH300")
      expect(result.discountAmountInKobo).toBe(30000)
      expect(Number.isInteger(result.discountAmountInKobo)).toBe(true)
    }
  })

  it("should reject a promo code when the budget is fully exhausted", async () => {
    const mockPromoDoc = {
      _id: samplePromoId,
      code: "BROKE2026",
      title: "Depleted Promo",
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 50000,
      budgetAllocatedInKobo: 100000,
      budgetSpentInKobo: 100000, // 100% exhausted
      currentRedemptions: 2,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })

    const result = await validatePromoCode({
      code: "BROKE2026",
      customerId: sampleCustomerId,
      vendorId: sampleVendorId,
      items: [{ menuItemId: "item-1", priceInKobo: 150000, quantity: 1 }],
    })

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain(
        "budget for this promo has been fully redeemed"
      )
    }
  })

  it("should enforce hierarchical vendor scoping (DoorDash onboarding hack)", async () => {
    const targetVendorId = new mongoose.Types.ObjectId()
    const otherVendorId = new mongoose.Types.ObjectId().toString()

    const mockPromoDoc = {
      _id: samplePromoId,
      code: "CHOP500",
      title: "Chop & Chill Exclusive",
      targetVendorId,
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 50000,
      budgetAllocatedInKobo: 500000,
      budgetSpentInKobo: 0,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })

    // Attempt from a mismatched vendor
    const resultMismatched = await validatePromoCode({
      code: "CHOP500",
      customerId: sampleCustomerId,
      vendorId: otherVendorId,
      items: [{ menuItemId: "item-1", priceInKobo: 150000, quantity: 1 }],
    })

    expect(resultMismatched.valid).toBe(false)
    if (!resultMismatched.valid) {
      expect(resultMismatched.error).toContain(
        "only valid for a specific restaurant"
      )
    }

    // Attempt with matching vendor
    mockPromoCodeRedemption.countDocuments.mockResolvedValue(0)
    const resultMatched = await validatePromoCode({
      code: "CHOP500",
      customerId: sampleCustomerId,
      vendorId: targetVendorId.toString(),
      items: [{ menuItemId: "item-1", priceInKobo: 150000, quantity: 1 }],
    })

    expect(resultMatched.valid).toBe(true)
  })

  it("should enforce hierarchical meal item scoping", async () => {
    const mockPromoDoc = {
      _id: samplePromoId,
      code: "JOLLOFSPOTLIGHT",
      title: "Jollof Spotlight",
      targetMenuItemId: "jollof-combo-42",
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 30000,
      budgetAllocatedInKobo: 300000,
      budgetSpentInKobo: 0,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })

    // Cart without the targeted meal
    const resultMissingItem = await validatePromoCode({
      code: "JOLLOFSPOTLIGHT",
      customerId: sampleCustomerId,
      vendorId: sampleVendorId,
      items: [
        { menuItemId: "fried-rice-99", priceInKobo: 180000, quantity: 1 },
      ],
    })

    expect(resultMissingItem.valid).toBe(false)
    if (!resultMissingItem.valid) {
      expect(resultMissingItem.error).toContain(
        "applies to a specific meal not in your cart"
      )
    }

    // Cart with the targeted meal
    mockPromoCodeRedemption.countDocuments.mockResolvedValue(0)
    const resultWithItem = await validatePromoCode({
      code: "JOLLOFSPOTLIGHT",
      customerId: sampleCustomerId,
      vendorId: sampleVendorId,
      items: [
        { menuItemId: "jollof-combo-42", priceInKobo: 220000, quantity: 1 },
      ],
    })

    expect(resultWithItem.valid).toBe(true)
  })

  it("should block a customer who has already used their 1 redemption", async () => {
    const mockPromoDoc = {
      _id: samplePromoId,
      code: "ONCEONLY",
      title: "Single Use Promo",
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 20000,
      budgetAllocatedInKobo: 500000,
      budgetSpentInKobo: 20000,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })
    // Simulate customer already having 1 redemption
    mockPromoCodeRedemption.countDocuments.mockResolvedValue(1)

    const result = await validatePromoCode({
      code: "ONCEONLY",
      customerId: sampleCustomerId,
      vendorId: sampleVendorId,
      items: [{ menuItemId: "item-1", priceInKobo: 150000, quantity: 1 }],
    })

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain("already used this promo code")
    }
  })

  it("should atomically record a promo code redemption and increment budget spent via findOneAndUpdate", async () => {
    mockPromoCode.findOneAndUpdate.mockResolvedValue({ _id: samplePromoId })
    mockPromoCodeRedemption.create.mockResolvedValue({})

    await redeemPromoCode({
      promoCodeId: samplePromoId,
      code: "PASTOR50",
      customerId: sampleCustomerId,
      orderId: "BH-ORDER-999",
      discountAmountInKobo: 30000,
    })

    expect(mockPromoCode.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: samplePromoId,
        isActive: true,
      }),
      {
        $inc: {
          budgetSpentInKobo: 30000,
          currentRedemptions: 1,
        },
      },
      { session: undefined, new: true }
    )

    expect(mockPromoCodeRedemption.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "PASTOR50",
        customerId: sampleCustomerId,
        orderId: "BH-ORDER-999",
        discountAmountInKobo: 30000,
      })
    )
  })

  it("should throw an error if budget or redemption limits are exceeded concurrently during redemption", async () => {
    mockPromoCode.findOneAndUpdate.mockResolvedValue(null) // Simulates concurrent budget breach

    await expect(
      redeemPromoCode({
        promoCodeId: samplePromoId,
        code: "PASTOR50",
        customerId: sampleCustomerId,
        orderId: "BH-ORDER-999",
        discountAmountInKobo: 30000,
      })
    ).rejects.toThrow("Promo code budget or redemption limit was exceeded")
  })

  describe("createPromoCodeSchema Naira-to-Kobo conversions", () => {
    it("should transform human Naira inputs to integer Kobo using nairaToKobo", () => {
      const parsed = createPromoCodeSchema.parse({
        code: "PASTORGIFT",
        title: "Pastor Youth Event",
        discountType: "FIXED_AMOUNT",
        discountInNaira: 500, // ₦500
        budgetInNaira: 25000, // ₦25,000
        minOrderValueInNaira: 1000, // ₦1,000
        maxRedemptionsPerCustomer: 1,
      })

      expect(parsed.code).toBe("PASTORGIFT")
      expect(parsed.discountValueInKobo).toBe(50000)
      expect(parsed.budgetAllocatedInKobo).toBe(2500000)
      expect(parsed.minOrderValueInKobo).toBe(100000)
    })

    it("should reject budgets under ₦10", () => {
      const result = promoCodeFormInputSchema.safeParse({
        code: "TOOLOW",
        title: "Too Low Budget",
        discountType: "FIXED_AMOUNT",
        discountInNaira: 5,
        budgetInNaira: 5, // Less than ₦10
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Budget must be at least ₦10"
        )
      }
    })
  })
})
