import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import CredentialsProvider from "next-auth/providers/credentials"
import { CredentialsSignin } from "next-auth"
import dbConnect from "@/lib/db"
import AdminUser from "@/models/AdminUser"
import VendorUserModel from "@/models/VendorUser"
import VendorModel from "@/models/Vendor"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { strictRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit"
import type { JWT } from "next-auth/jwt"

// ─── Custom error class ───────────────────────────────────────────────────────
// NextAuth masks error messages by default, returning the class name instead.
// Subclassing CredentialsSignin and storing the message in `code` preserves it.
class CustomAuthError extends CredentialsSignin {
  // Declare `code` as a class field so it overrides the parent's default
  // "CredentialsSignin" value regardless of transpiler field-init order.
  code = "CredentialsSignin"
  constructor(message: string) {
    super(message)
    this.code = message // Always wins
  }
}

// ─── Shared credential schema ─────────────────────────────────────────────────
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ─── Rate limit helper ────────────────────────────────────────────────────────
async function checkRateLimit(email: string) {
  if (!isRateLimitingEnabled) return
  const { success, reset } = await strictRateLimiter.limit(
    `login_email_${email.toLowerCase()}`
  )
  if (!success) {
    const seconds = Math.ceil((reset - Date.now()) / 1000)
    const minutes = Math.ceil(seconds / 60)
    const msg =
      seconds < 60
        ? `Too Many Requests, try again in ${seconds} seconds`
        : `Too Many Requests, try again in ${minutes} minute${minutes > 1 ? "s" : ""}`
    throw new CustomAuthError(msg)
  }
}

// ─── Session validation helper ────────────────────────────────────────────────
// Runs on every JWT refresh to check if the user has been deactivated or their
// password changed after the token was issued. Returns null to destroy the session.
async function validateSession(token: JWT): Promise<JWT | null> {
  if (!token.id || !token.role) return token
  try {
    await dbConnect()

    if (token.role === "vendor") {
      const dbUser = await VendorUserModel.findById(token.id)
        .select("lastPasswordChangeAt isActive")
        .lean()
      if (!dbUser || !dbUser.isActive) return null
      if (dbUser.lastPasswordChangeAt && token.iat) {
        const changedAtSeconds = Math.floor(
          dbUser.lastPasswordChangeAt.getTime() / 1000
        )
        if (changedAtSeconds > token.iat) return null
      }
    } else if (token.role === "admin" || token.role === "superadmin") {
      const dbUser = await AdminUser.findById(token.id)
        .select("isActive")
        .lean()
      if (!dbUser || !dbUser.isActive) return null
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
          if (!parsed.success) throw new CustomAuthError("Invalid inputs")

          const { email, password } = parsed.data
          await checkRateLimit(email)
          await dbConnect()

          const user = await VendorUserModel.findOne({
            email: email.toLowerCase(),
          })
          if (!user || !user.isActive)
            throw new CustomAuthError("Invalid credentials")

          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (!passwordsMatch) throw new CustomAuthError("Invalid credentials")

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
          throw new CustomAuthError(
            "Database or network error during authentication."
          )
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
          if (!parsed.success) throw new CustomAuthError("Invalid inputs")

          const { email, password } = parsed.data
          await checkRateLimit(email)
          await dbConnect()

          const user = await AdminUser.findOne({ email: email.toLowerCase() })
          if (!user || !user.isActive)
            throw new CustomAuthError("Invalid credentials")

          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (!passwordsMatch) throw new CustomAuthError("Invalid credentials")

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
          throw new CustomAuthError(
            "Database or network error during authentication."
          )
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
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
