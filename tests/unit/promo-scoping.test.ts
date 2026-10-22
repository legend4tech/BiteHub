import { describe, it, expect, vi, beforeEach } from "vitest"
import mongoose from "mongoose"
import { validatePromoCode } from "@/lib/services/promoCodeService"

const { mockPromoCode, mockPromoCodeRedemption, mockCustomer } = vi.hoisted(
  () => ({
    mockPromoCode: {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findById: vi.fn(),
    },
    mockPromoCodeRedemption: {
      countDocuments: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
    },
    mockCustomer: {
      findById: vi.fn(),
    },
  })
)

vi.mock("@/models/PromoCode", () => ({
  default: mockPromoCode,
}))

vi.mock("@/models/PromoCodeRedemption", () => ({
  default: mockPromoCodeRedemption,
}))

vi.mock("@/models/Customer", () => ({
  default: mockCustomer,
}))

vi.mock("@/lib/db", () => ({
  default: vi.fn().mockResolvedValue(true),
}))

describe("Promo Code Hierarchical Scoping Invariant Tests", () => {
  const samplePromoId = new mongoose.Types.ObjectId().toString()
  const sampleCustomerId = new mongoose.Types.ObjectId().toString()
  const sampleVendorId = new mongoose.Types.ObjectId().toString()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCustomer.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    })
  })

  it("should allow a guest customer (without customerId) when their selected school and campus match", async () => {
    const mockPromoDoc = {
      _id: samplePromoId,
      code: "GUESTULI",
      title: "Uli Guest Welcome",
      targetSchool: "coou",
      targetCampus: "uli",
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 50000,
      budgetAllocatedInKobo: 1000000,
      budgetSpentInKobo: 0,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })

    // Guest customer without customerId
    const result = await validatePromoCode({
      code: "GUESTULI",
      vendorId: sampleVendorId,
      school: "coou",
      campus: "uli",
      items: [{ menuItemId: "item-1", priceInKobo: 200000, quantity: 1 }],
    })

    expect(result.valid).toBe(true)
  })

  it("should reject a guest customer when their selected campus does not match the promo target campus", async () => {
    const mockPromoDoc = {
      _id: samplePromoId,
      code: "GUESTULI",
      title: "Uli Guest Welcome",
      targetSchool: "coou",
      targetCampus: "uli",
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 50000,
      budgetAllocatedInKobo: 1000000,
      budgetSpentInKobo: 0,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })

    // Guest on igbariam campus tries to use uli promo
    const result = await validatePromoCode({
      code: "GUESTULI",
      vendorId: sampleVendorId,
      school: "coou",
      campus: "igbariam",
      items: [{ menuItemId: "item-1", priceInKobo: 200000, quantity: 1 }],
    })

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain("only valid for orders on uli campus")
    }
  })

  it("should strictly reject a logged-in student whose profile school differs from promo targetSchool", async () => {
    const mockPromoDoc = {
      _id: samplePromoId,
      code: "COOUSTUDENT",
      title: "COOU Students Only",
      targetSchool: "coou",
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 50000,
      budgetAllocatedInKobo: 1000000,
      budgetSpentInKobo: 0,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })
    mockPromoCodeRedemption.countDocuments.mockResolvedValue(0)

    // Logged in student registered under unizik
    mockCustomer.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: sampleCustomerId,
          school: "unizik",
          campus: "awka",
        }),
      }),
    })

    const result = await validatePromoCode({
      code: "COOUSTUDENT",
      customerId: sampleCustomerId,
      vendorId: sampleVendorId,
      school: "coou",
      items: [{ menuItemId: "item-1", priceInKobo: 200000, quantity: 1 }],
    })

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain("only available to students of coou")
    }
  })

  it("should strictly reject a logged-in student whose profile campus differs from promo targetCampus", async () => {
    const mockPromoDoc = {
      _id: samplePromoId,
      code: "ULISTUDENT",
      title: "Uli Students Only",
      targetSchool: "coou",
      targetCampus: "uli",
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 50000,
      budgetAllocatedInKobo: 1000000,
      budgetSpentInKobo: 0,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })
    mockPromoCodeRedemption.countDocuments.mockResolvedValue(0)

    // Logged in student registered under igbariam campus
    mockCustomer.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: sampleCustomerId,
          school: "coou",
          campus: "igbariam",
        }),
      }),
    })

    const result = await validatePromoCode({
      code: "ULISTUDENT",
      customerId: sampleCustomerId,
      vendorId: sampleVendorId,
      school: "coou",
      campus: "uli",
      items: [{ menuItemId: "item-1", priceInKobo: 200000, quantity: 1 }],
    })

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain("only available to students on uli campus")
    }
  })

  it("should allow a logged-in student when profile school and campus match the promo target", async () => {
    const mockPromoDoc = {
      _id: samplePromoId,
      code: "ULISTUDENT",
      title: "Uli Students Only",
      targetSchool: "coou",
      targetCampus: "uli",
      discountType: "FIXED_AMOUNT",
      discountValueInKobo: 50000,
      budgetAllocatedInKobo: 1000000,
      budgetSpentInKobo: 0,
      maxRedemptionsPerCustomer: 1,
      isActive: true,
    }

    mockPromoCode.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockPromoDoc),
    })
    mockPromoCodeRedemption.countDocuments.mockResolvedValue(0)

    // Logged in student registered under uli campus
    mockCustomer.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: sampleCustomerId,
          school: "coou",
          campus: "uli",
        }),
      }),
    })

    const result = await validatePromoCode({
      code: "ULISTUDENT",
      customerId: sampleCustomerId,
      vendorId: sampleVendorId,
      school: "coou",
      campus: "uli",
      items: [{ menuItemId: "item-1", priceInKobo: 200000, quantity: 1 }],
    })

    expect(result.valid).toBe(true)
  })
})
