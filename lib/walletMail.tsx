import { render } from "@react-email/render"
import { mailer } from "./ses"
import React from "react"
import WalletTopupEmail from "@/emails/WalletTopupEmail"
import { NO_REPLY_EMAIL } from "./constants"

function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "no-reply@bitehubapp.com"
}

export async function sendWalletTopupEmail(
  email: string,
  customerName: string,
  amount: string,
  newBalance: string,
  reference: string
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("⚠️ AWS_ACCESS_KEY_ID is not defined in env. Email skipped.")
    return { success: false, error: "Email provider key missing" }
  }

  const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/customer/wallet`

  try {
    const html = await render(
      React.createElement(WalletTopupEmail, {
        customerName,
        amount,
        newBalance,
        reference,
        walletUrl,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "Wallet Top-up Successful 💸",
      html: html,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send wallet topup email:", error)
    return { success: false, error }
  }
}
