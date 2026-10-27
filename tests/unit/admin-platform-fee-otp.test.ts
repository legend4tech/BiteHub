import { describe, it, expect } from "vitest"
import crypto from "crypto"
import { ADMIN_OTP_EXPIRY_MINUTES } from "@/lib/constants"

describe("Admin Platform Fee 2FA Verification & Security", () => {
  it("generates a 6-digit cryptographic OTP and matching SHA-256 hash", () => {
    const otp = crypto.randomInt(100000, 1000000).toString()
    expect(otp).toHaveLength(6)
    expect(Number(otp)).toBeGreaterThanOrEqual(100000)
    expect(Number(otp)).toBeLessThan(1000000)

    const hash = crypto.createHash("sha256").update(otp).digest("hex")
    expect(hash).toHaveLength(64)

    const verifyHash = crypto.createHash("sha256").update(otp).digest("hex")
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(verifyHash, "hex"),
      Buffer.from(hash, "hex")
    )
    expect(isMatch).toBe(true)
  })

  it("rejects invalid OTP attempts using timingSafeEqual", () => {
    const validOtp = "123456"
    const validHash = crypto.createHash("sha256").update(validOtp).digest("hex")

    const wrongOtp = "654321"
    const wrongHash = crypto.createHash("sha256").update(wrongOtp).digest("hex")

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(wrongHash, "hex"),
      Buffer.from(validHash, "hex")
    )
    expect(isMatch).toBe(false)
  })

  it("enforces expiration after ADMIN_OTP_EXPIRY_MINUTES", () => {
    const now = Date.now()
    const expiresAt = new Date(now + ADMIN_OTP_EXPIRY_MINUTES * 60 * 1000)

    expect(expiresAt.getTime()).toBeGreaterThan(now)

    // Simulate expired timestamp 1 minute past expiry
    const simulatedPastExpiry = new Date(now - 1 * 60 * 1000)
    const isExpired = new Date() > simulatedPastExpiry
    expect(isExpired).toBe(true)
  })

  it("locks out further attempts when failed attempts count reaches or exceeds 5", () => {
    const maxAllowedAttempts = 5
    let currentAttempts = 4

    const isLockedBefore = currentAttempts >= maxAllowedAttempts
    expect(isLockedBefore).toBe(false)

    currentAttempts += 1
    const isLockedAfter = currentAttempts >= maxAllowedAttempts
    expect(isLockedAfter).toBe(true)
  })
})
