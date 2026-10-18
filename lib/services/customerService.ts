/**
 * @fileoverview Customer service layer.
 * Handles customer-related database operations (signup, account claiming, profile updates).
 * Used by auth API routes and potentially server actions/components.
 */

import Customer from "@/models/Customer"
import type { CustomerSignupValues } from "@/lib/schemas"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import {
  sendCustomerWelcomeEmail,
  sendCustomerVerificationOtpEmail,
} from "@/lib/authMail"
import { getCanonicalEmail, isDisposableEmail } from "@/lib/emailNormalization"
import { processReferralSignup } from "@/lib/services/gamificationService"

import dbConnect from "@/lib/db"
import {
  serializeWallet,
  serializeWalletTransaction,
  serializeCustomer,
} from "@/lib/serializers"
import { escapeRegex } from "@/lib/utils"

/**
 * Generates a unique username based on the customer's name.
 */
export async function generateUniqueUsername(name: string): Promise<string> {
  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 10)

  let isUnique = false
  let username = ""
  let attempts = 0

  while (!isUnique && attempts < 10) {
    const randomSuffix = crypto.randomBytes(2).toString("hex") // 4 chars
    username = `bh-${baseName}-${randomSuffix}`

    const existing = await Customer.findOne({ username }).lean()
    if (!existing) {
      isUnique = true
    }
    attempts++
  }

  if (!isUnique) {
    // Fallback if somehow 10 attempts failed
    username = `bh-${baseName}-${Date.now().toString(36)}`
  }

  return username
}

/**
 * Initiates customer signup by validating input, checking canonical email deduplication,
 * generating a secure 6-digit OTP, saving the unverified record, and dispatching verification email.
 */
export async function initiateCustomerSignup(data: CustomerSignupValues) {
  await dbConnect()
  const { name, email, phone, password, school, campus, referredBy } = data

  if (isDisposableEmail(email)) {
    throw new Error("DISPOSABLE_EMAIL_NOT_ALLOWED")
  }

  const canonicalEmail = getCanonicalEmail(email)
  const hashedPassword = await bcrypt.hash(password, 12)

  if (referredBy) {
    const referrer = await Customer.findOne({ referralCode: referredBy }).lean()
    if (!referrer) {
      throw new Error("INVALID_REFERRAL_CODE")
    }
    if (
      referrer.email === email.toLowerCase() ||
      referrer.canonicalEmail === canonicalEmail
    ) {
      throw new Error("CANNOT_REFER_SELF")
    }
  }

  const otp = crypto.randomInt(100000, 999999).toString()
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex")
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

  const emailLower = email.toLowerCase()
  let prevCustomer = null
  if (data.previousEmail && data.previousEmail.toLowerCase() !== emailLower) {
    const prevCanonical = getCanonicalEmail(data.previousEmail)
    prevCustomer = await Customer.findOne({
      $or: [
        { email: data.previousEmail.toLowerCase() },
        { canonicalEmail: prevCanonical },
        { email: prevCanonical },
      ],
      isEmailVerified: false,
    })
  }

  const existingCustomer = await Customer.findOne({
    $or: [{ email: emailLower }, { canonicalEmail }, { email: canonicalEmail }],
  })

  // Target existing unverified account or migrate unverified previous email account
  const targetDoc = existingCustomer || prevCustomer
  if (targetDoc) {
    // Security Guard: Verified accounts must NEVER be overwritten via signup
    if (existingCustomer?.isEmailVerified) {
      throw new Error("ACCOUNT_EXISTS")
    }

    if (
      prevCustomer &&
      existingCustomer &&
      prevCustomer._id.toString() !== existingCustomer._id.toString()
    ) {
      await Customer.deleteOne({ _id: prevCustomer._id })
    }

    Object.assign(targetDoc, {
      email: emailLower,
      canonicalEmail,
      name,
      phone,
      password: hashedPassword,
      school,
      campus,
      isEmailVerified: false,
      emailVerificationOtpHash: otpHash,
      emailVerificationOtpExpires: otpExpires,
      emailVerificationAttempts: 0,
    })
    if (referredBy && !targetDoc.referredBy) targetDoc.referredBy = referredBy
    if (!targetDoc.username)
      targetDoc.username = await generateUniqueUsername(name)

    await targetDoc.save()
    sendCustomerVerificationOtpEmail(email, name, otp).catch(console.error)
    return { status: "OTP_SENT", email }
  }

  // Brand-new customer
  const randomReferral = crypto.randomBytes(4).toString("hex")
  const referralCode = `REF-${randomReferral.toUpperCase()}`
  const username = await generateUniqueUsername(name)

  await Customer.create({
    name,
    username,
    email: email.toLowerCase(),
    canonicalEmail,
    phone,
    password: hashedPassword,
    referralCode,
    referredBy,
    isActive: true,
    isEmailVerified: false,
    emailVerificationOtpHash: otpHash,
    emailVerificationOtpExpires: otpExpires,
    emailVerificationAttempts: 0,
    school,
    campus,
  })

  sendCustomerVerificationOtpEmail(email, name, otp).catch(console.error)
  return { status: "OTP_SENT", email }
}

/**
 * Verifies a customer's 6-digit registration OTP, activates the account, and triggers welcome workflows.
 */
export async function verifyCustomerSignupOtp({
  email,
  otp,
}: {
  email: string
  otp: string
}) {
  await dbConnect()
  const canonicalEmail = getCanonicalEmail(email)
  const customer = await Customer.findOne({
    $or: [
      { email: email.toLowerCase() },
      { canonicalEmail },
      { email: canonicalEmail },
    ],
  })

  if (!customer) {
    throw new Error("USER_NOT_FOUND")
  }

  if (customer.isEmailVerified) {
    return { verified: true, alreadyVerified: true }
  }

  if (
    !customer.emailVerificationOtpExpires ||
    customer.emailVerificationOtpExpires < new Date()
  ) {
    throw new Error("OTP_EXPIRED")
  }

  if ((customer.emailVerificationAttempts || 0) >= 5) {
    throw new Error("OTP_MAX_ATTEMPTS")
  }

  // Constant-time cryptographic comparison to prevent timing attacks
  const incomingHash = crypto.createHash("sha256").update(otp.trim()).digest()

  let isMatch = false
  if (customer.emailVerificationOtpHash) {
    const storedHash = Buffer.from(customer.emailVerificationOtpHash, "hex")
    if (incomingHash.length === storedHash.length) {
      isMatch = crypto.timingSafeEqual(incomingHash, storedHash)
    }
  }

  if (!isMatch) {
    customer.emailVerificationAttempts =
      (customer.emailVerificationAttempts || 0) + 1
    await customer.save()
    throw new Error("INVALID_OTP")
  }

  // Mark customer verified
  customer.isEmailVerified = true
  customer.emailVerifiedAt = new Date()
  customer.emailVerificationOtpHash = undefined
  customer.emailVerificationOtpExpires = undefined
  customer.emailVerificationAttempts = 0
  await customer.save()

  // Process referral signup bonus if applicable
  if (customer.referredBy) {
    try {
      await processReferralSignup(customer._id.toString(), customer.referredBy)
    } catch (error: unknown) {
      console.error(
        "Error processing referral for newly verified customer:",
        error
      )
    }
  }

  // Welcome email
  sendCustomerWelcomeEmail(customer.email, customer.name).catch(console.error)

  // Smart Retroactive Linking: Link past guest orders matching email or canonical email
  try {
    const Order = (await import("@/models/Order")).default
    await Order.updateMany(
      {
        $or: [
          { customerEmail: customer.email },
          { customerEmail: canonicalEmail },
        ],
        customerId: { $exists: false },
      },
      { $set: { customerId: customer._id } }
    )
  } catch (error) {
    console.error("Error retroactively linking guest orders:", error)
  }

  return { verified: true }
}

/**
 * Resends a fresh 6-digit OTP to an unverified customer with rate-limit cooldown.
 */
export async function resendCustomerVerificationOtp(email: string) {
  await dbConnect()
  const canonicalEmail = getCanonicalEmail(email)
  const customer = await Customer.findOne({
    $or: [
      { email: email.toLowerCase() },
      { canonicalEmail },
      { email: canonicalEmail },
    ],
  })

  // Silent success for non-existent accounts to eliminate account enumeration attacks
  if (!customer) {
    return { success: true }
  }

  if (customer.isEmailVerified) {
    throw new Error("ALREADY_VERIFIED")
  }

  // Enforce 60s cooldown: initial expiry is +15m (900s). If > 14m (840s) left, < 60s passed
  if (customer.emailVerificationOtpExpires) {
    const msRemaining =
      customer.emailVerificationOtpExpires.getTime() - Date.now()
    if (msRemaining > 14 * 60 * 1000) {
      throw new Error("RESEND_COOLDOWN")
    }
  }

  const otp = crypto.randomInt(100000, 999999).toString()
  customer.emailVerificationOtpHash = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex")
  customer.emailVerificationOtpExpires = new Date(Date.now() + 15 * 60 * 1000)
  customer.emailVerificationAttempts = 0
  await customer.save()

  sendCustomerVerificationOtpEmail(customer.email, customer.name, otp).catch(
    console.error
  )
  return { success: true }
}

/** Legacy alias for backward compatibility */
export const registerOrClaimCustomer = initiateCustomerSignup

export async function getCustomerByEmail(email: string) {
  await dbConnect()
  return await Customer.findOne({ email }).lean()
}

export async function getCustomerWalletData(
  customerId: string | import("mongoose").Types.ObjectId
) {
  await dbConnect()
  const Wallet = (await import("@/models/Wallet")).default
  const WalletTransaction = (await import("@/models/WalletTransaction")).default

  const wallet = await Wallet.findOne({ customerId }).lean()
  let transactions: import("@/types/customer").Transaction[] = []
  let expiringRewards: import("@/types/customer").Transaction[] = []

  if (wallet) {
    const rawTransactions = await WalletTransaction.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    transactions = rawTransactions
      .map(serializeWalletTransaction)
      .filter(Boolean) as import("@/types/customer").Transaction[]

    const now = new Date()
    const rawExpiringRewards = await WalletTransaction.find({
      customerId,
      type: "reward",
      direction: "credit",
      isExpired: false,
      expiresAt: { $gt: now },
      $or: [
        { remainingAmountInKobo: { $gt: 0 } },
        { remainingAmountInKobo: { $exists: false } },
      ],
    })
      .sort({ expiresAt: 1 })
      .lean()

    expiringRewards = rawExpiringRewards
      .map(serializeWalletTransaction)
      .filter(Boolean) as import("@/types/customer").Transaction[]
  }

  return { wallet: serializeWallet(wallet), transactions, expiringRewards }
}

export async function getCustomerTransactionsList(
  customerId: string | import("mongoose").Types.ObjectId,
  page: number = 1,
  limit: number = 10,
  filter: string = "all"
) {
  await dbConnect()
  const WalletTransaction = (await import("@/models/WalletTransaction")).default

  const query: Record<string, unknown> = { customerId }

  if (filter === "credit") {
    query.direction = "credit"
  } else if (filter === "debit") {
    query.direction = "debit"
  } else if (filter === "rewards") {
    query.type = "reward"
  }

  const skip = (page - 1) * limit

  const [rawTransactions, totalTransactions] = await Promise.all([
    WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WalletTransaction.countDocuments(query),
  ])

  const transactions = rawTransactions
    .map(serializeWalletTransaction)
    .filter(Boolean) as import("@/types/customer").Transaction[]

  return {
    transactions,
    page,
    totalPages: Math.ceil(totalTransactions / limit),
    totalTransactions,
    hasMore: skip + transactions.length < totalTransactions,
  }
}

export async function getCustomerReferralCode(
  email: string
): Promise<string | null> {
  await dbConnect()
  const customer = await Customer.findOne({ email })
    .select("referralCode")
    .lean()
  return customer ? (customer.referralCode as string) : null
}

export async function getAdminCustomers(
  page: number = 1,
  limit: number = 20,
  search: string = ""
) {
  await dbConnect()

  const query: Record<string, unknown> = {}
  if (search) {
    const escapedSearch = escapeRegex(search)
    query.$or = [
      { email: { $regex: escapedSearch, $options: "i" } },
      { phone: { $regex: escapedSearch, $options: "i" } },
      { name: { $regex: escapedSearch, $options: "i" } },
      { referralCode: { $regex: escapedSearch, $options: "i" } },
    ]
  }

  const skip = (page - 1) * limit
  const [customers, total] = await Promise.all([
    Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Customer.countDocuments(query),
  ])

  return {
    customers: customers.map(serializeCustomer),
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}
