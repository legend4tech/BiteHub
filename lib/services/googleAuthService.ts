/**
 * @fileoverview Google authentication service layer.
 * Handles customer account creation, claiming, and verification via Google OAuth.
 */

import crypto from "crypto"
import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"
import VendorUserModel from "@/models/VendorUser"
import VendorModel from "@/models/Vendor"
import { cookies } from "next/headers"
import type { GoogleCustomerCompleteValues } from "@/lib/schemas/customer"
import { verifyGoogleSignupToken, signGoogleSignupToken } from "@/lib/tokens"
import { getCanonicalEmail, isDisposableEmail } from "@/lib/emailNormalization"
import { generateUniqueUsername } from "@/lib/services/customerService"
import { processReferralSignup } from "@/lib/services/gamificationService"
import { sendCustomerWelcomeEmail } from "@/lib/authMail"
import type { User, Account, Profile } from "next-auth"

export interface GoogleAuthUserResult {
  id: string
  name: string
  email: string
  role: "customer"
  image?: string
}

/**
 * Completes customer registration after Google OAuth.
 * Validates the signed 15-minute onboarding token, assigns required platform fields,
 * marks email as verified, triggers welcome bonuses, and links guest orders.
 */
export async function completeGoogleCustomerSignup(
  data: GoogleCustomerCompleteValues
): Promise<GoogleAuthUserResult> {
  const payload = verifyGoogleSignupToken(data.token)
  if (!payload) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN")
  }

  const { email, name: tokenName, image, referredBy: tokenRef } = payload
  if (isDisposableEmail(email)) {
    throw new Error("DISPOSABLE_EMAIL_NOT_ALLOWED")
  }

  await dbConnect()

  const finalName = data.name?.trim() || tokenName || "BiteHub Customer"
  const finalReferredBy =
    data.referredBy?.trim() || tokenRef?.trim() || undefined
  const canonicalEmail = getCanonicalEmail(email)
  const emailLower = email.toLowerCase().trim()

  // Validate referral code if provided
  if (finalReferredBy) {
    const referrer = await Customer.findOne({
      referralCode: finalReferredBy,
    }).lean()
    if (!referrer) {
      throw new Error("INVALID_REFERRAL_CODE")
    }
    if (
      referrer.email === emailLower ||
      referrer.canonicalEmail === canonicalEmail
    ) {
      throw new Error("CANNOT_REFER_SELF")
    }
  }

  // Check if an account already exists with this email or canonical email
  const existingCustomer = await Customer.findOne({
    $or: [{ email: emailLower }, { canonicalEmail }, { email: canonicalEmail }],
  })

  if (existingCustomer) {
    if (!existingCustomer.isActive) {
      throw new Error("ACCOUNT_SUSPENDED")
    }

    // Security Guard: Prevent onboarding token replay against already verified accounts
    if (existingCustomer.isEmailVerified) {
      throw new Error("TOKEN_ALREADY_USED")
    }

    // Claim unverified account (e.g. guest order profile created prior)
    existingCustomer.name = finalName
    existingCustomer.phone = data.phone
    existingCustomer.school = data.school
    existingCustomer.campus = data.campus
    existingCustomer.isEmailVerified = true
    existingCustomer.emailVerifiedAt = new Date()

    if (image && !existingCustomer.image) {
      existingCustomer.image = image
    }
    if (finalReferredBy && !existingCustomer.referredBy) {
      existingCustomer.referredBy = finalReferredBy
    }
    if (!existingCustomer.username) {
      existingCustomer.username = await generateUniqueUsername(finalName)
    }

    await existingCustomer.save()

    return {
      id: existingCustomer._id.toString(),
      name: existingCustomer.name,
      email: existingCustomer.email,
      role: "customer",
      image: existingCustomer.image,
    }
  }

  // Create brand new customer
  const randomReferral = crypto.randomBytes(4).toString("hex")
  const referralCode = `REF-${randomReferral.toUpperCase()}`
  const username = await generateUniqueUsername(finalName)

  const newCustomer = await Customer.create({
    name: finalName,
    username,
    email: emailLower,
    canonicalEmail,
    phone: data.phone,
    school: data.school,
    campus: data.campus,
    image: image || undefined,
    referralCode,
    referredBy: finalReferredBy,
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  })

  // Process referral signup bonus if applicable
  if (newCustomer.referredBy) {
    try {
      await processReferralSignup(
        newCustomer._id.toString(),
        newCustomer.referredBy
      )
    } catch (error) {
      console.error(
        "[completeGoogleCustomerSignup] Referral bonus error:",
        error
      )
    }
  }

  // Send welcome email (fire-and-forget)
  sendCustomerWelcomeEmail(newCustomer.email, newCustomer.name).catch(
    console.error
  )

  // Retroactively link past guest orders
  try {
    const Order = (await import("@/models/Order")).default
    await Order.updateMany(
      {
        $or: [
          { customerEmail: newCustomer.email },
          { customerEmail: canonicalEmail },
        ],
        customerId: { $exists: false },
      },
      { $set: { customerId: newCustomer._id } }
    )
  } catch (error) {
    console.error(
      "[completeGoogleCustomerSignup] Guest order link error:",
      error
    )
  }

  return {
    id: newCustomer._id.toString(),
    name: newCustomer.name,
    email: newCustomer.email,
    role: "customer",
    image: newCustomer.image,
  }
}

/**
 * Handles the Google OAuth callback authorization logic for both Vendor and Customer personas.
 * Returns true if sign-in succeeds, or a redirect URL string if redirection is needed.
 */
export async function handleGoogleSignIn({
  user,
  account,
  profile,
}: {
  user: User
  account?: Account | null
  profile?: Profile
}): Promise<boolean | string> {
  if (account?.provider !== "google" || !profile?.email) {
    return true
  }

  await dbConnect()
  const email = profile.email.toLowerCase().trim()
  const cookieStore = await cookies()
  const intent = cookieStore.get("bitehub_oauth_intent")?.value || "customer"
  const ref = cookieStore.get("bitehub_oauth_ref")?.value

  // ── Vendor Persona ──────────────────────────────────────────────────────────
  if (intent === "vendor") {
    const vendorUser = await VendorUserModel.findOne({ email })
    if (!vendorUser) {
      return "/vendor/login?error=NoVendorAccount"
    }
    if (!vendorUser.isActive) {
      return "/vendor/login?error=AccountSuspended"
    }

    // Update last login (non-blocking)
    VendorUserModel.findByIdAndUpdate(vendorUser._id, {
      lastLoginAt: new Date(),
    }).exec()

    const vendorId = vendorUser.vendorId.toString()
    const vendor = await VendorModel.findById(vendorId)
      .select("name image")
      .lean<{ name: string; image?: { url?: string } }>()

    user.id = vendorUser._id.toString()
    user.role = "vendor"
    user.vendorId = vendorId
    user.name = vendor ? vendor.name : vendorUser.email
    user.image = vendor?.image?.url || undefined

    return true
  }

  // ── Customer Persona ────────────────────────────────────────────────────────
  const canonicalEmail = getCanonicalEmail(email)
  const existingCustomer = await Customer.findOne({
    $or: [{ email }, { canonicalEmail }, { email: canonicalEmail }],
  })

  if (existingCustomer) {
    if (!existingCustomer.isActive) {
      return "/customer/login?error=AccountSuspended"
    }

    const googleImage =
      (user?.image as string) ||
      ((profile as Record<string, unknown>)?.picture as string) ||
      ((profile as Record<string, unknown>)?.image as string) ||
      ""

    // Sync avatar from Google if customer lacks an image
    if (!existingCustomer.image && googleImage) {
      existingCustomer.image = googleImage
    }
    if (!existingCustomer.isEmailVerified) {
      existingCustomer.isEmailVerified = true
      existingCustomer.emailVerifiedAt = new Date()
    }
    existingCustomer.lastLoginAt = new Date()
    await existingCustomer.save()

    user.id = existingCustomer._id.toString()
    user.role = "customer"
    user.name = existingCustomer.name
    user.image = existingCustomer.image

    return true
  }

  // Guard: If email belongs to an existing Vendor, do NOT prompt for customer onboarding
  const existingVendorUser = await VendorUserModel.findOne({ email })
  if (existingVendorUser) {
    return "/customer/login?error=VendorAccountFound"
  }

  const googleName = (profile?.name as string) || (user?.name as string) || ""
  const googleImage =
    (user?.image as string) ||
    ((profile as Record<string, unknown>)?.picture as string) ||
    ((profile as Record<string, unknown>)?.image as string) ||
    ""

  // Truly new customer: Generate signed 15-minute token embedding referral code
  const token = signGoogleSignupToken({
    email,
    name: googleName,
    image: googleImage,
    referredBy: ref || undefined,
  })

  return `/customer/complete-signup?token=${encodeURIComponent(token)}`
}
