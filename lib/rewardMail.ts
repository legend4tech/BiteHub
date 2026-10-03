import { Resend } from "resend"
import React from "react"
import RewardEarnedEmail from "@/emails/RewardEarnedEmail"
import RewardWarningEmail from "@/emails/RewardWarningEmail"
import ReEngagementEmail from "@/emails/ReEngagementEmail"
import { NO_REPLY_EMAIL } from "./constants"

const resend = new Resend(process.env.RESEND_API_KEY)

function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "onboarding@resend.dev"
}

export async function sendRewardEarnedEmail(
  email: string,
  customerName: string,
  rewardDescription: string,
  rewardAmount: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env. Email skipped.")
    return { success: false, error: "Email provider key missing" }
  }

  const rewardsUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/customer/rewards`

  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: "You Earned a Reward! 🎁",
      react: React.createElement(RewardEarnedEmail, {
        customerName,
        rewardDescription,
        rewardAmount,
        rewardsUrl,
      }),
    })

    if (error) {
      console.error("Resend API Error (Reward Earned):", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Failed to send reward earned email:", error)
    return { success: false, error }
  }
}

export async function sendRewardWarningEmail(
  email: string,
  customerName: string,
  expiringAmount: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env. Email skipped.")
    return { success: false, error: "Email provider key missing" }
  }

  const rewardsUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/customer/rewards`

  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: "Your coins are expiring soon! ⏳",
      react: React.createElement(RewardWarningEmail, {
        customerName,
        expiringAmount,
        rewardsUrl,
      }),
    })

    if (error) {
      console.error("Resend API Error (Reward Warning):", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Failed to send reward warning email:", error)
    return { success: false, error }
  }
}

export async function sendDormantCustomerEmail(
  email: string,
  customerName: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env. Email skipped.")
    return { success: false, error: "Email provider key missing" }
  }

  const menusUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/menus`

  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: "Your next meal is waiting 🍽️",
      react: React.createElement(ReEngagementEmail, {
        customerName,
        menusUrl,
      }),
    })

    if (error) {
      console.error("Resend API Error (ReEngagement):", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Failed to send re-engagement email:", error)
    return { success: false, error }
  }
}
