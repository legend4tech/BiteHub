/**
 * @fileoverview Customer service layer.
 * Handles customer-related database operations (signup, account claiming, profile updates).
 * Used by auth API routes and potentially server actions/components.
 */

import Customer from "@/models/Customer"
import type { CustomerSignupValues } from "@/lib/schemas"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendCustomerWelcomeEmail } from "@/lib/authMail"
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

export async function registerOrClaimCustomer(data: CustomerSignupValues) {
  await dbConnect()
  const { name, email, phone, password, school, campus, referredBy } = data

  const hashedPassword = await bcrypt.hash(password, 12)

  const existingCustomer = await Customer.findOne({ email }).lean()

  if (referredBy) {
    const referrer = await Customer.findOne({ referralCode: referredBy }).lean()
    if (!referrer) {
      throw new Error("INVALID_REFERRAL_CODE")
    }

    // Prevent self-referral if they are claiming their own guest account
    if (existingCustomer && referrer.email === existingCustomer.email) {
      throw new Error("CANNOT_REFER_SELF")
    }
  }

  if (existingCustomer) {
    if (existingCustomer.password) {
      throw new Error("ACCOUNT_EXISTS")
    } else {
      // CLAIM ACCOUNT LOGIC: user previously checked out as a guest
      const updateData: Record<string, unknown> = {
        name,
        phone,
        password: hashedPassword,
        isActive: true,
        school,
        campus,
      }
      if (!existingCustomer.username) {
        updateData.username = await generateUniqueUsername(name)
      }
      if (referredBy && !existingCustomer.referredBy) {
        updateData.referredBy = referredBy
      }

      await Customer.updateOne(
        { email },
        {
          $set: updateData,
        }
      )

      if (updateData.referredBy) {
        try {
          await processReferralSignup(
            existingCustomer._id.toString(),
            updateData.referredBy as string
          )
        } catch (error: unknown) {
          console.error("Error processing referral for claimed account:", error)
          const err = error as Error
          const { default: GamificationFailureLog } =
            await import("@/models/GamificationFailureLog")
          await GamificationFailureLog.create({
            customerId: existingCustomer._id,
            errorMessage: err.message,
            errorStack: err.stack,
            context: "processReferralSignup (claimed account)",
          }).catch(console.error)
        }
      }

      // Dispatch welcome email asynchronously
      sendCustomerWelcomeEmail(email, name).catch(console.error)

      // Smart Retroactive Linking: Link any past guest orders matching exactly this email
      const Order = (await import("@/models/Order")).default
      await Order.updateMany(
        { customerEmail: email, customerId: { $exists: false } },
        { $set: { customerId: existingCustomer._id } }
      )

      return { claimed: true }
    }
  }

  // New Customer creation
  const randomReferral = crypto.randomBytes(4).toString("hex")
  const referralCode = `REF-${randomReferral.toUpperCase()}`
  const username = await generateUniqueUsername(name)

  const customer = await Customer.create({
    name,
    username,
    email,
    phone,
    password: hashedPassword,
    referralCode,
    referredBy,
    isActive: true,
    school,
    campus,
  })

  if (referredBy) {
    try {
      await processReferralSignup(customer._id.toString(), referredBy)
    } catch (error: unknown) {
      console.error("Error processing referral for new account:", error)
      const err = error as Error
      const { default: GamificationFailureLog } =
        await import("@/models/GamificationFailureLog")
      await GamificationFailureLog.create({
        customerId: customer._id,
        errorMessage: err.message,
        errorStack: err.stack,
        context: "processReferralSignup (new account)",
      }).catch(console.error)
    }
  }

  // Dispatch welcome email asynchronously
  sendCustomerWelcomeEmail(email, name).catch(console.error)

  // Smart Retroactive Linking: Link any past guest orders matching exactly this email
  const Order = (await import("@/models/Order")).default
  await Order.updateMany(
    { customerEmail: email, customerId: { $exists: false } },
    { $set: { customerId: customer._id } }
  )

  return { claimed: false }
}

export async function getCustomerByEmail(email: string) {
  await dbConnect()
  const customer = await Customer.findOne({ email }).lean()
  return customer
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

    const rawExpiringRewards = await WalletTransaction.find({
      customerId,
      type: "reward",
      direction: "credit",
      isExpired: false,
      $or: [
        { remainingAmount: { $gt: 0 } },
        { remainingAmount: { $exists: false } },
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
