/**
 * @fileoverview Customer service layer.
 * Handles customer-related database operations (signup, account claiming, profile updates).
 * Used by auth API routes and potentially server actions/components.
 */

import Customer from "@/models/Customer"
import type { CustomerSignupValues } from "@/lib/schemas"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function registerOrClaimCustomer(data: CustomerSignupValues) {
  const { name, email, phone, password, school, campus } = data

  const hashedPassword = await bcrypt.hash(password, 12)

  const existingCustomer = await Customer.findOne({ email }).lean()

  if (existingCustomer) {
    if (existingCustomer.password) {
      throw new Error("ACCOUNT_EXISTS")
    } else {
      // CLAIM ACCOUNT LOGIC: user previously checked out as a guest
      await Customer.updateOne(
        { email },
        {
          $set: {
            name,
            phone,
            password: hashedPassword,
            isActive: true,
            school,
            campus,
          },
        }
      )
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
    isActive: true,
    school,
    campus,
  })

  return { claimed: false }
}
