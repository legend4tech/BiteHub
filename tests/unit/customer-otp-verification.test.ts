import { describe, it, expect, vi, beforeEach } from "vitest"
import crypto from "crypto"
import {
  initiateCustomerSignup,
  verifyCustomerSignupOtp,
  resendCustomerVerificationOtp,
} from "@/lib/services/customerService"

const {
  mockCustomer,
  mockOrder,
  mockSendCustomerVerificationOtpEmail,
  mockSendCustomerWelcomeEmail,
  mockProcessReferralSignup,
} = vi.hoisted(() => ({
  mockCustomer: {
    findOne: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
  },
  mockOrder: {
    updateMany: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
  },
  mockSendCustomerVerificationOtpEmail: vi
    .fn()
    .mockResolvedValue({ success: true }),
  mockSendCustomerWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
  mockProcessReferralSignup: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock("@/lib/db", () => ({
  default: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/models/Customer", () => ({
  default: mockCustomer,
}))

vi.mock("@/models/Order", () => ({
  default: mockOrder,
}))

vi.mock("@/lib/authMail", () => ({
  sendCustomerVerificationOtpEmail: mockSendCustomerVerificationOtpEmail,
  sendCustomerWelcomeEmail: mockSendCustomerWelcomeEmail,
}))

vi.mock("@/lib/services/gamificationService", () => ({
  processReferralSignup: mockProcessReferralSignup,
}))

function mockQuery<T>(val: T) {
  return {
    lean: vi.fn().mockResolvedValue(val),
    then: <TResult1 = T, TResult2 = never>(
      resolve?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) => Promise.resolve(val).then(resolve, reject),
  }
}

describe("Customer OTP Verification & Anti-Abuse Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initiateCustomerSignup", { timeout: 15_000 }, () => {
    it("generates a 6-digit OTP and stores it as a SHA-256 hash (never plain text)", async () => {
      mockCustomer.findOne.mockReturnValue(mockQuery(null))
      mockCustomer.create.mockResolvedValue({ _id: "new-cust-1" })

      const signupData = {
        name: "Test Student",
        email: "student@example.com",
        phone: "+2348012345678",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
        school: "OAU",
        campus: "Main Campus",
      }

      const result = await initiateCustomerSignup(signupData)
      expect(result.status).toBe("OTP_SENT")
      expect(mockCustomer.create).toHaveBeenCalledTimes(1)

      const createdDoc = mockCustomer.create.mock.calls[0][0]
      // Invariant: canonical email is calculated
      expect(createdDoc.canonicalEmail).toBe("student@example.com")
      // Invariant: initially unverified
      expect(createdDoc.isEmailVerified).toBe(false)
      // Invariant: hash length is 64 hex characters (SHA-256)
      expect(createdDoc.emailVerificationOtpHash).toHaveLength(64)
      // Invariant: expires in ~15 mins
      expect(createdDoc.emailVerificationOtpExpires.getTime()).toBeGreaterThan(
        Date.now() + 14 * 60 * 1000
      )
      // Invariant: dispatched via email
      expect(mockSendCustomerVerificationOtpEmail).toHaveBeenCalledWith(
        "student@example.com",
        "Test Student",
        expect.stringMatching(/^\d{6}$/)
      )
    })

    it("rejects duplicate registration if verified account already exists with canonical email", async () => {
      // Mock existing verified account
      mockCustomer.findOne.mockReturnValue(
        mockQuery({
          _id: "existing-1",
          email: "student@example.com",
          canonicalEmail: "student@example.com",
          isEmailVerified: true,
          password: "existing-hash",
        })
      )

      const duplicateAttempt = {
        name: "Aliased Student",
        // Trying Gmail plus trick to bypass
        email: "student+bonus@example.com",
        phone: "+2348012345678",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
        school: "OAU",
        campus: "Main Campus",
      }

      await expect(initiateCustomerSignup(duplicateAttempt)).rejects.toThrow(
        "ACCOUNT_EXISTS"
      )
      expect(mockCustomer.create).not.toHaveBeenCalled()
    })

    it("allows re-initiating signup for an existing unverified account and issues a fresh OTP", async () => {
      const unverifiedDoc = {
        _id: "unverified-1",
        email: "student@example.com",
        canonicalEmail: "student@example.com",
        isEmailVerified: false,
        password: "hashed-pw",
        name: "Old Name",
        phone: "+2348000000000",
        school: "Old School",
        campus: "Old Campus",
        emailVerificationAttempts: 2,
        emailVerificationOtpHash: "old-hash",
        emailVerificationOtpExpires: new Date(Date.now() + 5000),
        save: vi.fn().mockResolvedValue(true),
      }
      mockCustomer.findOne.mockReturnValue(mockQuery(unverifiedDoc))

      const retrySignup = {
        name: "Updated Name",
        email: "student@example.com",
        phone: "+2348012345678",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
        school: "OAU",
        campus: "Main Campus",
      }

      const res = await initiateCustomerSignup(retrySignup)
      expect(res.status).toBe("OTP_SENT")
      expect(mockCustomer.create).not.toHaveBeenCalled()
      expect(unverifiedDoc.save).toHaveBeenCalledTimes(1)
      expect(unverifiedDoc.name).toBe("Updated Name")
      expect(unverifiedDoc.isEmailVerified).toBe(false)
      expect(unverifiedDoc.emailVerificationAttempts).toBe(0)
      expect(unverifiedDoc.emailVerificationOtpHash).not.toBe("old-hash")
      expect(mockSendCustomerVerificationOtpEmail).toHaveBeenCalledWith(
        "student@example.com",
        "Updated Name",
        expect.stringMatching(/^\d{6}$/)
      )
    })

    it("migrates unverified account when changing email via previousEmail", async () => {
      const prevDoc = {
        _id: "prev-1",
        email: "typo@gmail.com",
        canonicalEmail: "typo@gmail.com",
        isEmailVerified: false,
        password: "hashed-pw",
        name: "Test User",
        phone: "+2348012345678",
        school: "OAU",
        campus: "Main Campus",
        save: vi.fn().mockResolvedValue(true),
      }

      // First query (prevCustomer lookup) returns prevDoc, second query (new email lookup) returns null
      mockCustomer.findOne
        .mockReturnValueOnce(mockQuery(prevDoc))
        .mockReturnValueOnce(mockQuery(null))

      const changeEmailAttempt = {
        name: "Test User",
        email: "fixed@gmail.com",
        previousEmail: "typo@gmail.com",
        phone: "+2348012345678",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
        school: "OAU",
        campus: "Main Campus",
      }

      const res = await initiateCustomerSignup(changeEmailAttempt)
      expect(res.status).toBe("OTP_SENT")
      expect(res.email).toBe("fixed@gmail.com")
      expect(mockCustomer.create).not.toHaveBeenCalled()
      expect(prevDoc.save).toHaveBeenCalledTimes(1)
      expect(prevDoc.email).toBe("fixed@gmail.com")
      expect(prevDoc.canonicalEmail).toBe("fixed@gmail.com")
      expect(mockSendCustomerVerificationOtpEmail).toHaveBeenCalledWith(
        "fixed@gmail.com",
        "Test User",
        expect.stringMatching(/^\d{6}$/)
      )
    })

    it("blocks throwaway/disposable email addresses", async () => {
      const disposableAttempt = {
        name: "Bot User",
        email: "bot@tempmail.com",
        phone: "+2348012345678",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
        school: "OAU",
        campus: "Main Campus",
      }

      await expect(initiateCustomerSignup(disposableAttempt)).rejects.toThrow(
        "DISPOSABLE_EMAIL_NOT_ALLOWED"
      )
    })
  })

  describe("verifyCustomerSignupOtp", () => {
    const rawOtp = "654321"
    const validHash = crypto.createHash("sha256").update(rawOtp).digest("hex")

    it("verifies matching OTP, sets isEmailVerified = true, and clears OTP fields", async () => {
      const mockDoc = {
        _id: { toString: () => "cust-123" },
        email: "student@example.com",
        name: "Student",
        isEmailVerified: false,
        emailVerifiedAt: undefined as Date | undefined,
        emailVerificationOtpHash: validHash as string | undefined,
        emailVerificationOtpExpires: new Date(Date.now() + 10 * 60 * 1000) as
          | Date
          | undefined,
        emailVerificationAttempts: 0,
        save: vi.fn().mockResolvedValue(true),
      }
      mockCustomer.findOne.mockReturnValue(mockQuery(mockDoc))

      const res = await verifyCustomerSignupOtp({
        email: "student@example.com",
        otp: "654321",
      })

      expect(res.verified).toBe(true)
      expect(mockDoc.isEmailVerified).toBe(true)
      expect(mockDoc.emailVerifiedAt).toBeInstanceOf(Date)
      expect(mockDoc.emailVerificationOtpHash).toBeUndefined()
      expect(mockDoc.emailVerificationOtpExpires).toBeUndefined()
      expect(mockDoc.save).toHaveBeenCalledTimes(1)
      expect(mockSendCustomerWelcomeEmail).toHaveBeenCalled()
    })

    it("enforces the 15-minute expiration invariant (rejects expired code)", async () => {
      const expiredDoc = {
        _id: { toString: () => "cust-123" },
        email: "student@example.com",
        isEmailVerified: false,
        emailVerificationOtpHash: validHash,
        // Expired 1 minute ago
        emailVerificationOtpExpires: new Date(Date.now() - 60 * 1000),
        emailVerificationAttempts: 0,
        save: vi.fn(),
      }
      mockCustomer.findOne.mockReturnValue(mockQuery(expiredDoc))

      await expect(
        verifyCustomerSignupOtp({ email: "student@example.com", otp: rawOtp })
      ).rejects.toThrow("OTP_EXPIRED")
      expect(expiredDoc.save).not.toHaveBeenCalled()
    })

    it("increments attempts on invalid OTP and rejects with INVALID_OTP", async () => {
      const mockDoc = {
        _id: { toString: () => "cust-123" },
        email: "student@example.com",
        isEmailVerified: false,
        emailVerificationOtpHash: validHash,
        emailVerificationOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
        emailVerificationAttempts: 2,
        save: vi.fn().mockResolvedValue(true),
      }
      mockCustomer.findOne.mockReturnValue(mockQuery(mockDoc))

      await expect(
        verifyCustomerSignupOtp({ email: "student@example.com", otp: "000000" })
      ).rejects.toThrow("INVALID_OTP")
      expect(mockDoc.emailVerificationAttempts).toBe(3)
      expect(mockDoc.save).toHaveBeenCalledTimes(1)
    })

    it("enforces the 5-attempt brute-force lockout invariant", async () => {
      const lockedDoc = {
        _id: { toString: () => "cust-123" },
        email: "student@example.com",
        isEmailVerified: false,
        emailVerificationOtpHash: validHash,
        emailVerificationOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
        emailVerificationAttempts: 5,
        save: vi.fn(),
      }
      mockCustomer.findOne.mockReturnValue(mockQuery(lockedDoc))

      await expect(
        verifyCustomerSignupOtp({ email: "student@example.com", otp: rawOtp })
      ).rejects.toThrow("OTP_MAX_ATTEMPTS")
    })
  })

  describe("resendCustomerVerificationOtp", () => {
    it("enforces a 60-second cooldown before allowing a resend", async () => {
      const mockDoc = {
        _id: { toString: () => "cust-123" },
        email: "student@example.com",
        isEmailVerified: false,
        // Generated 15 seconds ago (14m45s remaining of 15m window)
        emailVerificationOtpExpires: new Date(
          Date.now() + (14 * 60 + 45) * 1000
        ),
        save: vi.fn(),
      }
      mockCustomer.findOne.mockReturnValue(mockQuery(mockDoc))

      await expect(
        resendCustomerVerificationOtp("student@example.com")
      ).rejects.toThrow("RESEND_COOLDOWN")
      expect(mockDoc.save).not.toHaveBeenCalled()
    })

    it("successfully issues a new OTP once the cooldown passes", async () => {
      const mockDoc = {
        _id: { toString: () => "cust-123" },
        email: "student@example.com",
        name: "Student",
        isEmailVerified: false,
        // Generated 2 minutes ago (13m remaining)
        emailVerificationOtpExpires: new Date(Date.now() + 13 * 60 * 1000),
        emailVerificationOtpHash: "old-hash",
        emailVerificationAttempts: 3,
        save: vi.fn().mockResolvedValue(true),
      }
      mockCustomer.findOne.mockReturnValue(mockQuery(mockDoc))

      const res = await resendCustomerVerificationOtp("student@example.com")
      expect(res.success).toBe(true)
      expect(mockDoc.emailVerificationAttempts).toBe(0)
      expect(mockDoc.emailVerificationOtpHash).not.toBe("old-hash")
      expect(mockDoc.save).toHaveBeenCalledTimes(1)
      expect(mockSendCustomerVerificationOtpEmail).toHaveBeenCalled()
    })
  })
})
