import { render } from "@react-email/render"
import { mailer } from "./ses"
import React from "react"
import RewardEarnedEmail from "@/emails/RewardEarnedEmail"
import RewardWarningEmail from "@/emails/RewardWarningEmail"
import ReEngagementEmail from "@/emails/ReEngagementEmail"
import { NO_REPLY_EMAIL } from "./constants"

function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "no-reply@bitehubapp.com"
}

export async function sendRewardEarnedEmail(
  email: string,
  customerName: string,
  rewardDescription: string,
  rewardAmount: string
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("⚠️ AWS_ACCESS_KEY_ID is not defined in env. Email skipped.")
    return { success: false, error: "Email provider key missing" }
  }

  const rewardsUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/customer/rewards`

  try {
    const html = await render(
      React.createElement(RewardEarnedEmail, {
        customerName,
        rewardDescription,
        rewardAmount,
        rewardsUrl,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "You Earned a Reward! 🎁",
      html: html,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send reward earned email:", error)
    return { success: false, error }
  }
}

export async function sendRewardWarningEmail(
  email: string,
  customerName: string,
  expiringItems: string
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("⚠️ AWS_ACCESS_KEY_ID is not defined in env. Email skipped.")
    return { success: false, error: "Email provider key missing" }
  }

  const rewardsUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/customer/rewards`

  try {
    const html = await render(
      React.createElement(RewardWarningEmail, {
        customerName,
        expiringItems,
        rewardsUrl,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "Your rewards are expiring soon! ⏳",
      html: html,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send reward warning email:", error)
    return { success: false, error }
  }
}

export async function sendDormantCustomerEmail(
  email: string,
  customerName: string
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("⚠️ AWS_ACCESS_KEY_ID is not defined in env. Email skipped.")
    return { success: false, error: "Email provider key missing" }
  }

  const menusUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/menus`

  try {
    const html = await render(
      React.createElement(ReEngagementEmail, {
        customerName,
        menusUrl,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "Your next meal is waiting 🍽️",
      html: html,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send re-engagement email:", error)
    return { success: false, error }
  }
}
