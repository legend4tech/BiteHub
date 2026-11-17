import { describe, it, expect } from "vitest"
import {
  stellarSessionRequestSchema,
  stellarSimulateRequestSchema,
  stellarVerifyRequestSchema,
} from "@/lib/schemas/stellar"
import {
  createStellarDepositSession,
  MOCK_USDC_NAIRA_RATE,
  BITEHUB_RECEIVING_ACCOUNT,
} from "@/lib/stellar/stellarTestnet"

describe("Stellar Zero-Wallet Prototype Unit Tests", () => {
  describe("Schema Validation", () => {
    it("validates valid session requests", () => {
      const valid = stellarSessionRequestSchema.safeParse({
        amountInNaira: 5000,
      })
      expect(valid.success).toBe(true)
      if (valid.success) {
        expect(valid.data.amountInNaira).toBe(5000)
      }
    })

    it("rejects non-positive amounts in session requests", () => {
      const zero = stellarSessionRequestSchema.safeParse({ amountInNaira: 0 })
      expect(zero.success).toBe(false)

      const negative = stellarSessionRequestSchema.safeParse({
        amountInNaira: -100,
      })
      expect(negative.success).toBe(false)
    })

    it("validates simulation requests", () => {
      const valid = stellarSimulateRequestSchema.safeParse({
        destinationAddress: BITEHUB_RECEIVING_ACCOUNT,
        memo: "123456",
        amount: "5.00",
      })
      expect(valid.success).toBe(true)
    })

    it("validates verify requests", () => {
      const valid = stellarVerifyRequestSchema.safeParse({ memo: "987654" })
      expect(valid.success).toBe(true)

      const invalid = stellarVerifyRequestSchema.safeParse({ memo: "" })
      expect(invalid.success).toBe(false)
    })
  })

  describe("Session Generator", () => {
    it("generates a well-formed session with 6-digit memo and SEP-0007 URI", () => {
      const amountInNaira = 8000
      const session = createStellarDepositSession(amountInNaira)

      expect(session).toBeDefined()
      expect(session.sessionId).toContain("STELLAR-SES-")
      expect(session.amountInNaira).toBe(8000)
      expect(session.exchangeRate).toBe(MOCK_USDC_NAIRA_RATE)

      // Expected 8000 / 1600 = 5.00 USDC
      expect(session.amountInUSDC).toBe("5.00")

      // 6-digit numeric memo
      expect(session.memo).toMatch(/^\d{6}$/)

      // Destination address matches receiving account
      expect(session.destinationAddress).toBe(BITEHUB_RECEIVING_ACCOUNT)

      // SEP-0007 compliant pay URI
      expect(session.qrUri).toContain("web+stellar:pay")
      expect(session.qrUri).toContain(
        `destination=${BITEHUB_RECEIVING_ACCOUNT}`
      )
      expect(session.qrUri).toContain(`memo=${session.memo}`)
      expect(session.qrUri).toContain("asset_code=USDC")
    })

    it("never mutates or interacts with database wallet models", () => {
      // Invariant: Pure isolated function
      const session = createStellarDepositSession(1000)
      expect(session).not.toHaveProperty("balanceInKobo")
      expect(session).not.toHaveProperty("walletId")
    })
  })
})
