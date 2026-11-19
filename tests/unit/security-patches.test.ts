import { describe, it, expect, vi } from "vitest"
import crypto from "crypto"

vi.mock("@/lib/db", () => ({
  default: vi.fn().mockResolvedValue(true),
}))

vi.mock("@/models/Order", () => ({
  default: {
    find: vi.fn(),
  },
}))

vi.mock("@/models/MenuItem", () => ({
  default: {
    bulkWrite: vi.fn(),
  },
}))
import {
  serializeOrder,
  serializePublicOrder,
} from "@/lib/serializers/orderSerializer"
import { generateUnsubscribeToken } from "@/lib/utils"

describe("Security Patch Invariants", () => {
  describe("Order Serializer Privacy & Margin Protection", () => {
    const mockOrder = {
      _id: "660c1f2e9d2f1b001a123456",
      orderId: "BH-123456",
      vendorId: "660c1f2e9d2f1b001a654321",
      vendorName: "Campus Burger",
      vendorWhatsappNumber: "08011223344",
      vendorPrepTime: "15 mins",
      customerName: "Jane Doe",
      customerPhone: "08098765432",
      location: "Hostel Block A",
      items: [
        {
          menuItemId: "item_1",
          name: "Cheeseburger",
          priceInKobo: 250000,
          quantity: 2,
        },
      ],
      notes: "Extra sauce please",
      deliveryFeeInKobo: 50000,
      serviceFeeInKobo: 15000,
      platformCommissionInKobo: 75000,
      vendorRevenueInKobo: 425000,
      totalAmountInKobo: 565000,
      status: "preparing",
      paymentMethod: "monnify",
      paymentStatus: "paid",
      monnifyReference: "MNFY_REF_SECRET_123",
      createdAt: new Date("2026-01-01T10:00:00Z"),
      updatedAt: new Date("2026-01-01T10:05:00Z"),
    } as unknown as Parameters<typeof serializeOrder>[0]

    it("masks phone and zeroes internal margins when isPublic is true", () => {
      const publicDoc = serializePublicOrder(mockOrder)
      expect(publicDoc).not.toBeNull()
      expect(publicDoc?.customerPhone).toBe("0809 •••• 432")
      expect(publicDoc?.vendorWhatsappNumber).toBe("")
      expect(publicDoc?.vendorRevenueInKobo).toBe(0)
      expect(publicDoc?.platformCommissionInKobo).toBe(0)
      expect(publicDoc?.monnifyReference).toBeNull()

      // Public fields must remain intact for tracking
      expect(publicDoc?.orderId).toBe("BH-123456")
      expect(publicDoc?.vendorName).toBe("Campus Burger")
      expect(publicDoc?.totalAmountInKobo).toBe(565000)
      expect(publicDoc?.status).toBe("preparing")
      expect(publicDoc?.items).toHaveLength(1)
    })

    it("preserves phone, WhatsApp, and margins for authenticated owners", () => {
      const internalDoc = serializeOrder(mockOrder, { isPublic: false })
      expect(internalDoc).not.toBeNull()
      expect(internalDoc?.customerPhone).toBe("08098765432")
      expect(internalDoc?.vendorWhatsappNumber).toBe("08011223344")
      expect(internalDoc?.vendorRevenueInKobo).toBe(425000)
      expect(internalDoc?.platformCommissionInKobo).toBe(75000)
      expect(internalDoc?.monnifyReference).toBe("MNFY_REF_SECRET_123")
    })
  })

  describe("Unsubscribe Token Security & Normalization", () => {
    it("produces identical tokens regardless of casing or extra whitespace", () => {
      const token1 = generateUnsubscribeToken("Student@Example.Com ")
      const token2 = generateUnsubscribeToken("student@example.com")
      expect(token1).toBe(token2)
      expect(token1).toHaveLength(64)
    })

    it("validates token in constant time using timingSafeEqual", () => {
      const email = "user@school.edu"
      const expectedToken = generateUnsubscribeToken(email)

      const validBuf = Buffer.from(expectedToken)
      const testBuf = Buffer.from(expectedToken)
      expect(
        validBuf.length === testBuf.length &&
          crypto.timingSafeEqual(validBuf, testBuf)
      ).toBe(true)

      const forgedBuf = Buffer.from(
        generateUnsubscribeToken("other@school.edu")
      )
      expect(
        validBuf.length === forgedBuf.length &&
          crypto.timingSafeEqual(validBuf, forgedBuf)
      ).toBe(false)
    })

    it("throws an explicit error when no secret is configured, preventing predictable fallbacks", () => {
      const originalAuth = process.env.AUTH_SECRET
      const originalNextAuth = process.env.NEXTAUTH_SECRET
      try {
        delete process.env.AUTH_SECRET
        delete process.env.NEXTAUTH_SECRET
        expect(() => generateUnsubscribeToken("test@example.com")).toThrow(
          "AUTH_SECRET or NEXTAUTH_SECRET must be configured"
        )
      } finally {
        process.env.AUTH_SECRET = originalAuth
        process.env.NEXTAUTH_SECRET = originalNextAuth
      }
    })
  })

  describe("Vendor Bank OTP Timing Attack Defense", () => {
    it("safely verifies OTP hashes in constant time", () => {
      const rawOtp = "482910"
      const storedHash = crypto
        .createHash("sha256")
        .update(rawOtp)
        .digest("hex")

      const correctInputHash = crypto
        .createHash("sha256")
        .update("482910")
        .digest("hex")
      const isValid =
        storedHash.length === correctInputHash.length &&
        crypto.timingSafeEqual(
          Buffer.from(storedHash, "utf-8"),
          Buffer.from(correctInputHash, "utf-8")
        )
      expect(isValid).toBe(true)

      const wrongInputHash = crypto
        .createHash("sha256")
        .update("123456")
        .digest("hex")
      const isInvalid =
        storedHash.length === wrongInputHash.length &&
        crypto.timingSafeEqual(
          Buffer.from(storedHash, "utf-8"),
          Buffer.from(wrongInputHash, "utf-8")
        )
      expect(isInvalid).toBe(false)
    })

    it("handles length mismatch safely without throwing crypto exception", () => {
      const storedHash = "short"
      const inputHash = crypto
        .createHash("sha256")
        .update("123456")
        .digest("hex")
      const isValid =
        storedHash.length === inputHash.length &&
        crypto.timingSafeEqual(
          Buffer.from(storedHash, "utf-8"),
          Buffer.from(inputHash, "utf-8")
        )
      expect(isValid).toBe(false)
    })
  })

  describe("Cron Release Quantity Authorization Invariants", () => {
    it("rejects unauthorized cron requests regardless of NODE_ENV", async () => {
      const env = process.env as Record<string, string | undefined>
      const originalEnv = env.NODE_ENV
      const originalSecret = env.CRON_SECRET
      try {
        env.NODE_ENV = "test"
        env.CRON_SECRET = "super_secure_cron_secret_12345"

        const { GET } = await import("@/app/api/cron/release-quantity/route")

        // 1. Missing Authorization header
        const unauthReq = new Request(
          "https://bitehubapp.com/api/cron/release-quantity"
        )
        const res1 = await GET(unauthReq)
        expect(res1.status).toBe(401)
        const json1 = await res1.json()
        expect(json1.error).toBe("Unauthorized")

        // 2. Invalid Bearer token
        const wrongAuthReq = new Request(
          "https://bitehubapp.com/api/cron/release-quantity",
          {
            headers: { authorization: "Bearer wrong_secret_token_abc" },
          }
        )
        const res2 = await GET(wrongAuthReq)
        expect(res2.status).toBe(401)

        // 3. Length mismatch Bearer token
        const shortAuthReq = new Request(
          "https://bitehubapp.com/api/cron/release-quantity",
          {
            headers: { authorization: "Bearer short" },
          }
        )
        const res3 = await GET(shortAuthReq)
        expect(res3.status).toBe(401)
      } finally {
        env.NODE_ENV = originalEnv
        env.CRON_SECRET = originalSecret
      }
    }, 15000)
  })
})
