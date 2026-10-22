import { describe, it, expect, vi, beforeEach } from "vitest"
import mongoose from "mongoose"
import { resolveCheckoutDiscounts } from "@/lib/services/checkoutDiscountService"

vi.mock("@/lib/services/promoCodeService", () => ({
  validatePromoCode: vi.fn(),
}))

describe("Checkout Discount & Wallet Invariant Tests", () => {
  const sampleCustomerId = new mongoose.Types.ObjectId()
  const sampleVendorId = new mongoose.Types.ObjectId().toString()
  const sampleVendor = {
    _id: sampleVendorId,
    campus: "Main Campus",
    school: "OAU",
  }
  const sampleItems = [
    {
      menuItemId: "item-1",
      name: "Jollof Rice",
      quantity: 1,
      priceInKobo: 250000,
    },
  ]
  const dbMenuItemsMap = new Map([["item-1", { priceInKobo: 250000 }]])

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should reject guest unauthenticated users attempting to use a promo code", async () => {
    const result = await resolveCheckoutDiscounts({
      appliedPromoCode: "WELCOME500",
      paymentMethod: "wallet",
      session: null, // Guest with no session
      existingCustomer: null,
      vendor: sampleVendor,
      vendorId: sampleVendorId,
      items: sampleItems,
      dbMenuItemsMap,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.status).toBe(401)
      expect(result.requiresSignup).toBe(true)
      expect(result.error).toContain("logged in to your BiteHub account")
    }
  })

  it("should reject promo code if payment method is not wallet", async () => {
    const result = await resolveCheckoutDiscounts({
      appliedPromoCode: "WELCOME500",
      paymentMethod: "monnify", // Disallowed payment method for promo codes
      session: {
        user: { id: "cust-1", email: "student@oau.edu.ng" },
        expires: "2099-01-01",
      },
      existingCustomer: {
        _id: sampleCustomerId,
        email: "student@oau.edu.ng",
      },
      vendor: sampleVendor,
      vendorId: sampleVendorId,
      items: sampleItems,
      dbMenuItemsMap,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.status).toBe(400)
      expect(result.error).toContain("BiteHub Wallet to pay")
    }
  })

  it("should reject using both voucher and promo code on the same order", async () => {
    const result = await resolveCheckoutDiscounts({
      appliedPromoCode: "WELCOME500",
      appliedVoucherCode: "FREEVOUCHER",
      paymentMethod: "wallet",
      session: {
        user: { id: "cust-1", email: "student@oau.edu.ng" },
        expires: "2099-01-01",
      },
      existingCustomer: {
        _id: sampleCustomerId,
        email: "student@oau.edu.ng",
      },
      vendor: sampleVendor,
      vendorId: sampleVendorId,
      items: sampleItems,
      dbMenuItemsMap,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.status).toBe(400)
      expect(result.error).toContain(
        "cannot use both a voucher and a promo code"
      )
    }
  })

  it("should successfully compute promo discount for authenticated customer with wallet payment", async () => {
    const { validatePromoCode } =
      await import("@/lib/services/promoCodeService")
    vi.mocked(validatePromoCode).mockResolvedValue({
      valid: true,
      promoCodeId: "promo-123",
      code: "WELCOME500",
      title: "Welcome 500",
      description: null,
      discountAmountInKobo: 50000,
    })

    const result = await resolveCheckoutDiscounts({
      appliedPromoCode: "WELCOME500",
      paymentMethod: "wallet",
      session: {
        user: { id: "cust-1", email: "student@oau.edu.ng" },
        expires: "2099-01-01",
      },
      existingCustomer: {
        _id: sampleCustomerId,
        email: "student@oau.edu.ng",
      },
      vendor: sampleVendor,
      vendorId: sampleVendorId,
      items: sampleItems,
      dbMenuItemsMap,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.promoDiscountInKobo).toBe(50000)
      expect(result.promoCodeData?.code).toBe("WELCOME500")
      expect(result.isRewardSponsored).toBe(false)
    }
  })
})
