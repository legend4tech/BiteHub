import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import CredentialsProvider from "next-auth/providers/credentials"
import { CredentialsSignin } from "next-auth"
import dbConnect from "@/lib/db"
import AdminUser from "@/models/AdminUser"
import VendorUserModel from "@/models/VendorUser"
import VendorModel from "@/models/Vendor"
import CustomerModel from "@/models/Customer"
import bcrypt from "bcryptjs"
import { strictRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit"
import { getCanonicalEmail } from "@/lib/emailNormalization"
import type { JWT } from "next-auth/jwt"

class AccountSuspendedError extends CredentialsSignin {
  code = "AccountSuspended"
}

class RateLimitExceededError extends CredentialsSignin {
  code = "RateLimitExceeded"
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "InvalidCredentials"
}

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EmailNotVerified"
}

class CustomAuthError extends CredentialsSignin {
  code = "CustomAuthError"
  constructor(message: string) {
    super(message)
    this.code = message
  }
}

import Google from "next-auth/providers/google"
import {
  completeGoogleCustomerSignup,
  handleGoogleSignIn,
} from "@/lib/services/googleAuthService"
import { verifyGoogleSignupToken } from "@/lib/tokens"
import { googleCustomerCompleteSchema } from "@/lib/schemas/customer"
import { adminLoginSchema as credentialsSchema } from "@/lib/schemas"

// ─── Rate limit helper ────────────────────────────────────────────────────────
async function checkRateLimit(email: string) {
  if (!isRateLimitingEnabled) return
  const { success } = await strictRateLimiter.limit(
    `login_email_${email.toLowerCase()}`
  )
  if (!success) {
    throw new RateLimitExceededError()
  }
}

// ─── Session validation helper ────────────────────────────────────────────────
// Runs on every JWT refresh to check if the user has been deactivated or their
// password changed after the token was issued. Returns null to destroy the session.
// Also syncs name and image from the DB back into the token so the Navbar always
// reflects the latest profile data without needing a log-out/log-in cycle.
async function validateSession(token: JWT): Promise<JWT | null> {
  if (!token.id || !token.role) return token
  try {
    await dbConnect()

    if (token.role === "vendor") {
      const dbUser = await VendorUserModel.findById(token.id)
        .select("lastPasswordChangeAt isActive email name image")
        .lean()
      if (!dbUser || !dbUser.isActive) return null
      // Invalidate session if email was changed on another device
      if (
        token.email &&
        dbUser.email &&
        token.email.toLowerCase() !== dbUser.email.toLowerCase()
      ) {
        return null
      }
      if (dbUser.lastPasswordChangeAt && token.iat) {
        const changedAtSeconds = Math.floor(
          dbUser.lastPasswordChangeAt.getTime() / 1000
        )
        if (changedAtSeconds > token.iat) return null
      }
      // Sync display fields so the JWT self-heals on every refresh
      if (dbUser.name) token.name = dbUser.name
      if (dbUser.image) token.image = dbUser.image
    } else if (token.role === "admin" || token.role === "superadmin") {
      const dbUser = await AdminUser.findById(token.id)
        .select("isActive name")
        .lean()
      if (!dbUser || !dbUser.isActive) return null
      if (dbUser.name) token.name = dbUser.name
    } else if (token.role === "customer") {
      const dbUser = await CustomerModel.findById(token.id)
        .select(
          "isActive isEmailVerified lastPasswordChangeAt email name image"
        )
        .lean()
      if (!dbUser || !dbUser.isActive || dbUser.isEmailVerified === false)
        return null
      // Invalidate session if email was changed on another device
      if (
        token.email &&
        dbUser.email &&
        token.email.toLowerCase() !== dbUser.email.toLowerCase()
      ) {
        return null
      }
      if (dbUser.lastPasswordChangeAt && token.iat) {
        const changedAtSeconds = Math.floor(
          dbUser.lastPasswordChangeAt.getTime() / 1000
        )
        if (changedAtSeconds > token.iat) return null
      }
      // Sync display fields — use !== undefined so clearing the image also propagates
      if (dbUser.name) token.name = dbUser.name
      if (dbUser.image !== undefined) token.image = dbUser.image
    }
  } catch (error) {
    console.error("[validateSession] DB error:", error)
    // On DB errors, fail open (let the session persist) to avoid locking out users
    // during transient outages. The session will be re-validated on the next request.
  }
  return token
}

// ─── NextAuth config ──────────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    // ── Vendor Login ──────────────────────────────────────────────────────────
    CredentialsProvider({
      id: "vendor-login",
      name: "Vendor",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = credentialsSchema.safeParse(credentials)
          if (!parsed.success) throw new InvalidCredentialsError()

          const { email, password } = parsed.data
          await checkRateLimit(email)
          await dbConnect()

          const user = await VendorUserModel.findOne({
            email: email.toLowerCase(),
          })
          if (!user) throw new InvalidCredentialsError()

          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (!passwordsMatch) throw new InvalidCredentialsError()

          if (!user.isActive) throw new AccountSuspendedError()

          // Update last login (fire and forget — non-blocking)
          VendorUserModel.findByIdAndUpdate(user._id, {
            lastLoginAt: new Date(),
          }).exec()

          // Fetch vendor profile for display name & image
          const vendorId = user.vendorId.toString()
          const vendor = await VendorModel.findById(vendorId)
            .select("name image")
            .lean<{ name: string; image?: { url?: string } }>()

          return {
            id: user._id.toString(),
            name: vendor ? vendor.name : user.email,
            email: user.email,
            role: "vendor",
            vendorId,
            image: vendor ? vendor.image?.url : undefined,
          }
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error
          console.error("[vendor-login authorize]", error)
          throw new Error("Database or network error during authentication.")
        }
      },
    }),

    // ── Admin Login ───────────────────────────────────────────────────────────
    CredentialsProvider({
      id: "admin-login",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = credentialsSchema.safeParse(credentials)
          if (!parsed.success) throw new InvalidCredentialsError()

          const { email, password } = parsed.data
          await checkRateLimit(email)
          await dbConnect()

          const user = await AdminUser.findOne({ email: email.toLowerCase() })
          if (!user) throw new InvalidCredentialsError()

          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (!passwordsMatch) throw new InvalidCredentialsError()

          if (!user.isActive) throw new AccountSuspendedError()

          // Update last login (fire and forget — non-blocking)
          AdminUser.findByIdAndUpdate(user._id, {
            lastLoginAt: new Date(),
          }).exec()

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            vendorId: undefined,
            image: undefined,
          }
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error
          console.error("[admin-login authorize]", error)
          throw new Error("Database or network error during authentication.")
        }
      },
    }),

    // ── Customer Login ─────────────────────────────────────────────────────────
    CredentialsProvider({
      id: "customer-login",
      name: "Customer",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = credentialsSchema.safeParse(credentials)
          if (!parsed.success) throw new InvalidCredentialsError()

          const { email, password } = parsed.data
          await checkRateLimit(email)
          await dbConnect()

          const canonicalEmail = getCanonicalEmail(email)
          const user = await CustomerModel.findOne({
            $or: [
              { email: email.toLowerCase() },
              { canonicalEmail },
              { email: canonicalEmail },
            ],
          })
          if (!user || !user.password) {
            throw new InvalidCredentialsError()
          }

          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (!passwordsMatch) throw new InvalidCredentialsError()

          if (!user.isActive) {
            throw new AccountSuspendedError()
          }

          if (!user.isEmailVerified) {
            throw new EmailNotVerifiedError()
          }

          // Update last login (fire and forget — non-blocking)
          CustomerModel.findByIdAndUpdate(user._id, {
            lastLoginAt: new Date(),
          }).exec()

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: "customer",
            vendorId: undefined,
            image: user.image,
          }
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error
          console.error("[customer-login authorize]", error)
          throw new Error("Database or network error during authentication.")
        }
      },
    }),

    // ── Google OAuth Provider ────────────────────────────────────────────────
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ── Google Customer Complete Registration ────────────────────────────────
    CredentialsProvider({
      id: "customer-google-complete",
      name: "Google Customer Complete",
      credentials: {
        token: { label: "Token", type: "text" },
        phone: { label: "Phone", type: "text" },
        school: { label: "School", type: "text" },
        campus: { label: "Campus", type: "text" },
        referredBy: { label: "Referred By", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        try {
          const parsed = googleCustomerCompleteSchema.safeParse(credentials)
          if (!parsed.success) {
            throw new InvalidCredentialsError()
          }

          const tokenPayload = verifyGoogleSignupToken(parsed.data.token)
          if (!tokenPayload) {
            throw new CustomAuthError(
              "Signup session expired. Please sign in with Google again."
            )
          }

          await checkRateLimit(tokenPayload.email)

          const customer = await completeGoogleCustomerSignup(parsed.data)
          return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            role: "customer",
            vendorId: undefined,
            image: customer.image,
          }
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error
          if (error instanceof Error && error.message === "ACCOUNT_SUSPENDED") {
            throw new AccountSuspendedError()
          }
          if (
            error instanceof Error &&
            error.message === "INVALID_REFERRAL_CODE"
          ) {
            throw new CustomAuthError("The referral code provided is invalid.")
          }
          if (error instanceof Error && error.message === "CANNOT_REFER_SELF") {
            throw new CustomAuthError("You cannot refer yourself.")
          }
          if (
            error instanceof Error &&
            error.message === "DISPOSABLE_EMAIL_NOT_ALLOWED"
          ) {
            throw new CustomAuthError(
              "Disposable or temporary email addresses are not permitted."
            )
          }
          if (
            error instanceof Error &&
            error.message === "INVALID_OR_EXPIRED_TOKEN"
          ) {
            throw new CustomAuthError(
              "Signup session expired. Please sign in with Google again."
            )
          }
          if (
            error instanceof Error &&
            error.message === "TOKEN_ALREADY_USED"
          ) {
            throw new CustomAuthError(
              "This signup link has already been used. Please log in."
            )
          }
          console.error("[customer-google-complete authorize]", error)
          throw new Error("Database error during registration.")
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      return await handleGoogleSignIn({ user, account, profile })
    },
    async jwt({ token, user, trigger, session }) {
      // Execute base logic from authConfig (sets id, role, vendorId, image on initial sign in)
      let newToken = token
      if (authConfig.callbacks?.jwt) {
        newToken =
          (await authConfig.callbacks.jwt({ token, user, trigger, session })) ||
          token
      }

      // Validate session against DB to handle deactivation and password changes.
      // Only runs on refreshes (when user object is absent), not on initial sign in.
      if (!user) {
        const validated = await validateSession(newToken)
        return validated
      }

      return newToken
    },
  },
})
