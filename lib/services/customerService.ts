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

import dbConnect from "@/lib/db"
import { serializeWallet, serializeWalletTransaction } from "@/lib/serializers"

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
      if (referredBy && !existingCustomer.referredBy) {
        updateData.referredBy = referredBy
      }

      await Customer.updateOne(
        { email },
        {
          $set: updateData,
        }
      )

      // Dispatch welcome email asynchronously
      sendCustomerWelcomeEmail(email, name).catch(console.error)

      return { claimed: true }
    }
  }

  // New Customer creation
  const randomReferral = crypto.randomBytes(4).toString("hex")
  const referralCode = `REF-${randomReferral.toUpperCase()}`

  await Customer.create({
    name,
    email,
    phone,
    password: hashedPassword,
    referralCode,
    referredBy,
    isActive: true,
    school,
    campus,
  })

  // Dispatch welcome email asynchronously
  sendCustomerWelcomeEmail(email, name).catch(console.error)

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
  if (wallet) {
    const rawTransactions = await WalletTransaction.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    transactions = rawTransactions
      .map(serializeWalletTransaction)
      .filter(Boolean) as import("@/types/customer").Transaction[]
  }

  return { wallet: serializeWallet(wallet), transactions }
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
