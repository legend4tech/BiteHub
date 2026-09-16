import { Resend } from "resend"
import React from "react"
import WalletTopupEmail from "@/emails/WalletTopupEmail"
import { NO_REPLY_EMAIL } from "./constants"

const resend = new Resend(process.env.RESEND_API_KEY)

function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "onboarding@resend.dev"
}

export async function sendWalletTopupEmail(
  email: string,
  customerName: string,
  amount: string,
  newBalance: string,
  reference: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env. Email skipped.")
    return { success: false, error: "Email provider key missing" }
  }

  const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/customer/wallet`

  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: "Wallet Top-up Successful 💸",
      react: React.createElement(WalletTopupEmail, {
        customerName,
        amount,
        newBalance,
        reference,
        walletUrl,
      }),
    })

    if (error) {
      console.error("Resend API Error (Wallet Topup):", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Failed to send wallet topup email:", error)
    return { success: false, error }
  }
}
