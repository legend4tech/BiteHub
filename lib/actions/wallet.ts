"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"
import Wallet from "@/models/Wallet"
import { createMonnifyReservedAccount } from "@/lib/monnify"

/**
 * Server Action: Activates a customer's wallet by creating a Monnify
 * reserved account tied to their customer ID.
 */
export async function activateWallet() {
  const session = await auth()

  if (!session?.user?.email || session.user.role !== "customer") {
    redirect("/customer/login")
  }

  await dbConnect()

  const customer = await Customer.findOne({ email: session.user.email })
  if (!customer) {
    redirect("/customer/login")
  }

  try {
    const accountReference = `WALLET-${customer._id.toString()}-${Date.now()}`
    const accountName = `BiteHub Wallet - ${customer.name}`

    const reservedAccount = await createMonnifyReservedAccount({
      accountReference,
      accountName,
      customerEmail: customer.email,
      customerName: customer.name,
    })

    // Monnify returns `accounts` array when getAllAvailableBanks is used,
    // or a single-item array when preferredBanks is set.
    const accountDetails = reservedAccount.accounts?.[0] ?? reservedAccount

    const existingWallet = await Wallet.findOne({ customerId: customer._id })

    if (!existingWallet) {
      await Wallet.create({
        customerId: customer._id,
        balance: 0,
        monnifyReservedAccountRef: accountReference,
        accountName: accountDetails.accountName,
        accountNumber: accountDetails.accountNumber,
        bankName: accountDetails.bankName,
      })
    } else {
      await Wallet.updateOne(
        { customerId: customer._id },
        {
          $set: {
            monnifyReservedAccountRef: accountReference,
            accountName: accountDetails.accountName,
            accountNumber: accountDetails.accountNumber,
            bankName: accountDetails.bankName,
          },
        }
      )
    }
  } catch (err) {
    console.error(
      "[activateWallet] Monnify reserved account creation failed:",
      err
    )
    // Re-throw so the UI can catch it (using useFormState or try/catch on the client)
    throw new Error("Failed to activate wallet. Please try again.")
  }

  revalidatePath("/customer/dashboard/wallet")
}
