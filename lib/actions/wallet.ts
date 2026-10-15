"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import dbConnect from "@/lib/db"
import Customer from "@/models/Customer"
import Wallet from "@/models/Wallet"
import {
  createMonnifyReservedAccount,
  validateMonnifyBankAccount,
} from "@/lib/monnify"

import { walletActivationSchema } from "@/lib/schemas/customer"

export type ActionState = { error?: string; success?: boolean } | undefined

/**
 * Server Action: Activates a customer's wallet by creating a Monnify
 * reserved account tied to their customer ID.
 */
export async function activateWallet(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = walletActivationSchema.safeParse({ nin: formData.get("nin") })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid NIN" }
  }
  const { nin } = parsed.data

  const session = await auth()

  if (!session?.user?.email || session.user.role !== "customer") {
    redirect("/customer/login")
  }

  await dbConnect()

  const customer = await Customer.findOne({ email: session.user.email })
  if (!customer) {
    redirect("/customer/login")
  }

  const existingWallet = await Wallet.findOne({ customerId: customer._id })
  if (existingWallet?.accountNumber) {
    revalidatePath("/customer/dashboard/wallet")
    return { success: true }
  }

  try {
    const accountReference = `WALLET-${customer._id.toString()}-${Date.now()}`
    const accountName = `BiteHub Wallet - ${customer.name}`

    // In development, append a timestamp to bypass Monnify sandbox glitch (R42 limit)
    const monnifyEmail =
      process.env.NODE_ENV === "development"
        ? customer.email.replace("@", `+${Date.now()}@`)
        : customer.email

    const reservedAccount = await createMonnifyReservedAccount({
      accountReference,
      accountName,
      customerEmail: monnifyEmail,
      customerName: customer.name,
      nin,
    })

    // Monnify returns `accounts` array when getAllAvailableBanks is used,
    // or a single-item array when preferredBanks is set.
    const accountDetails = reservedAccount.accounts?.[0] ?? reservedAccount

    // Resolve the true NIBSS-validated account name
    const validatedAccount = await validateMonnifyBankAccount(
      accountDetails.accountNumber,
      accountDetails.bankCode
    )
    const trueAccountName =
      validatedAccount.accountName || accountDetails.accountName

    if (!existingWallet) {
      await Wallet.create({
        customerId: customer._id,
        balanceInKobo: 0,
        depositBalanceInKobo: 0,
        promoBalanceInKobo: 0,
        monnifyReservedAccountRef: accountReference,
        accountName: trueAccountName,
        accountNumber: accountDetails.accountNumber,
        bankName: accountDetails.bankName,
      })
    } else {
      await Wallet.updateOne(
        { customerId: customer._id },
        {
          $set: {
            monnifyReservedAccountRef: accountReference,
            accountName: trueAccountName,
            accountNumber: accountDetails.accountNumber,
            bankName: accountDetails.bankName,
          },
        }
      )
    }
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      // Wallet was created concurrently by a parallel request
      const createdWallet = await Wallet.findOne({ customerId: customer._id })
      if (createdWallet?.accountNumber) {
        revalidatePath("/customer/dashboard/wallet")
        return { success: true }
      }
    }
    console.error(
      "[activateWallet] Monnify reserved account creation failed:",
      err
    )
    return { error: "Failed to activate wallet. Please try again." }
  }

  revalidatePath("/customer/dashboard/wallet")
  return { success: true }
}
