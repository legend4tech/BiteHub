import { describe, it, expect, beforeEach, afterEach } from "vitest"
import crypto from "crypto"
import { signGoogleSignupToken, verifyGoogleSignupToken } from "@/lib/tokens"
import {
  googleCustomerCompleteSchema,
  googleCustomerCompleteFormSchema,
} from "@/lib/schemas/customer"

describe("Google Auth Token & Schemas", () => {
  const originalSecret = process.env.AUTH_SECRET

  beforeEach(() => {
    process.env.AUTH_SECRET =
      "test-secret-for-signing-google-onboarding-tokens-32chars"
  })

  afterEach(() => {
    process.env.AUTH_SECRET = originalSecret
  })

  describe("signGoogleSignupToken & verifyGoogleSignupToken", () => {
    it("successfully signs and verifies a valid token", () => {
      const payload = {
        email: "test.student@gmail.com",
        name: "Ada Lovelace",
        image: "https://lh3.googleusercontent.com/a/sample-photo=s96-c",
        referredBy: "REF-TEST123",
      }

      const token = signGoogleSignupToken(payload)
      expect(typeof token).toBe("string")
      expect(token).toContain(".")

      const verified = verifyGoogleSignupToken(token)
      expect(verified).not.toBeNull()
      expect(verified?.jti).toBeDefined()
      expect(typeof verified?.jti).toBe("string")
      expect(verified?.jti.length).toBeGreaterThan(10)
      expect(verified?.email).toBe("test.student@gmail.com")
      expect(verified?.name).toBe("Ada Lovelace")
      expect(verified?.image).toBe(
        "https://lh3.googleusercontent.com/a/sample-photo=s96-c"
      )
      expect(verified?.referredBy).toBe("REF-TEST123")
      expect(verified?.exp).toBeGreaterThan(Date.now())
    })

    it("handles payload without optional referredBy", () => {
      const payload = {
        email: "solo@example.com",
        name: "Solo User",
        image: "https://lh3.googleusercontent.com/photo",
      }

      const token = signGoogleSignupToken(payload)
      const verified = verifyGoogleSignupToken(token)
      expect(verified).not.toBeNull()
      expect(verified?.email).toBe("solo@example.com")
      expect(verified?.referredBy).toBeUndefined()
    })

    it("rejects a tampered token signature", () => {
      const token = signGoogleSignupToken({
        email: "student@example.com",
        name: "Real Student",
        image: "https://lh3.googleusercontent.com/photo",
      })

      const [encodedPayload] = token.split(".")
      const tamperedToken = `${encodedPayload}.0000000000000000000000000000000000000000000000000000000000000000`

      const verified = verifyGoogleSignupToken(tamperedToken)
      expect(verified).toBeNull()
    })

    it("rejects an expired token", () => {
      // Craft expired payload
      const expiredPayload = {
        email: "expired@example.com",
        name: "Old Token",
        image: "",
        exp: Date.now() - 1000, // 1 second in the past
      }

      const encoded = Buffer.from(JSON.stringify(expiredPayload))
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")

      const sig = crypto
        .createHmac("sha256", process.env.AUTH_SECRET!)
        .update(encoded)
        .digest("hex")

      const expiredToken = `${encoded}.${sig}`

      const verified = verifyGoogleSignupToken(expiredToken)
      expect(verified).toBeNull()
    })

    it("rejects a token with invalid or missing purpose (domain separation)", () => {
      // Craft validly-signed token but with wrong purpose
      const invalidPurposePayload = {
        purpose: "some_other_flow",
        email: "student@example.com",
        name: "Student",
        image: "",
        exp: Date.now() + 60000,
      }

      const encoded = Buffer.from(JSON.stringify(invalidPurposePayload))
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")

      const sig = crypto
        .createHmac("sha256", process.env.AUTH_SECRET!)
        .update(encoded)
        .digest("hex")

      const tokenWithWrongPurpose = `${encoded}.${sig}`
      expect(verifyGoogleSignupToken(tokenWithWrongPurpose)).toBeNull()
    })

    it("rejects malformed or non-string inputs", () => {
      expect(verifyGoogleSignupToken("")).toBeNull()
      expect(verifyGoogleSignupToken("invalid-token-without-dot")).toBeNull()
      expect(verifyGoogleSignupToken(null as unknown as string)).toBeNull()
    })
  })

  describe("Google Completion Schemas", () => {
    it("validates and normalizes phone number in googleCustomerCompleteSchema", () => {
      const validData = {
        token: "some-signed-token.sig",
        phone: "08012345678",
        school: "coou",
        campus: "uli",
        referredBy: "REF-WELCOME",
      }

      const parsed = googleCustomerCompleteSchema.safeParse(validData)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.phone).toBe("+2348012345678")
        expect(parsed.data.school).toBe("coou")
        expect(parsed.data.campus).toBe("uli")
        expect(parsed.data.referredBy).toBe("REF-WELCOME")
      }
    })

    it("rejects invalid Nigerian phone number", () => {
      const invalidData = {
        token: "some-token.sig",
        phone: "12345",
        school: "coou",
        campus: "uli",
      }

      const parsed = googleCustomerCompleteSchema.safeParse(invalidData)
      expect(parsed.success).toBe(false)
    })

    it("rejects missing required fields (school, campus, token)", () => {
      expect(
        googleCustomerCompleteSchema.safeParse({
          token: "",
          phone: "08012345678",
          school: "",
          campus: "",
        }).success
      ).toBe(false)
    })

    it("validates googleCustomerCompleteFormSchema without mutating phone", () => {
      const formData = {
        phone: "08012345678",
        school: "coou",
        campus: "uli",
        referredBy: "",
      }

      const parsed = googleCustomerCompleteFormSchema.safeParse(formData)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        // Form schema should NOT transform the phone string
        expect(parsed.data.phone).toBe("08012345678")
      }
    })
  })
})
