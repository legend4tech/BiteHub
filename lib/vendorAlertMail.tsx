/**
 * vendorAlertMail.ts
 *
 * Transactional email helpers specifically for vendor operational alerts.
 * Extracted from lib/mail.ts to keep each file within the 450-line limit (§3).
 *
 * Currently handles:
 *  - Low Stock Alert — notifies vendors when a menu item stock drops to or below
 *    LOW_STOCK_THRESHOLD so they can restock before selling out entirely.
 */

import { render } from "@react-email/render"
import { mailer } from "./ses"
import React from "react"
import VendorLowStockAlertEmail from "@/emails/VendorLowStockAlertEmail"
import VendorNewReviewEmail from "@/emails/VendorNewReviewEmail"
import { NO_REPLY_EMAIL } from "./constants"

/**
 * Sends a one-time low stock alert to the vendor when a menu item's remaining
 * quantity drops at or below LOW_STOCK_THRESHOLD during checkout.
 *
 * Idempotency is enforced by the `lowStockAlertSent` flag on the MenuItem
 * document — this function is only called when that flag is still false.
 *
 * @param vendorId          - The vendor's MongoDB ObjectId string (used to look up their email)
 * @param vendorName        - Display name for the email greeting
 * @param itemName          - The menu item that is running low
 * @param remainingQuantity - The quantity remaining after the triggering purchase
 */
export async function sendVendorLowStockAlertEmail(
  vendorId: string,
  vendorName: string,
  itemName: string,
  remainingQuantity: number
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
      "⚠️ AWS_ACCESS_KEY_ID not set. Skipping vendor low stock alert email."
    )
    return { success: false, error: "Email provider key missing" }
  }

  // Dynamic import keeps this server-only module out of the edge runtime bundle
  const { default: VendorUser } = await import("@/models/VendorUser")
  const { default: dbConnect } = await import("@/lib/db")
  await dbConnect()
  const vendorUser = (await VendorUser.findOne({ vendorId }).lean()) as {
    email?: string
  } | null

  if (!vendorUser?.email) {
    console.warn(
      `[sendVendorLowStockAlertEmail] No email found for vendorId: ${vendorId}`
    )
    return { success: false, error: "Vendor email not found" }
  }

  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "no-reply@bitehubapp.com"

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/vendor/dashboard/menu`

  try {
    const html = await render(
      React.createElement(VendorLowStockAlertEmail, {
        vendorName,
        itemName,
        remainingQuantity,
        dashboardUrl,
      })
    )
    await mailer.sendMail({
      from: resolvedFrom,
      to: vendorUser.email,
      subject: `Low Stock Alert: ${itemName} is running out!`,
      html: html,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send vendor low stock alert email:", error)
    return { success: false, error }
  }
}

export async function sendVendorNewReviewEmail(
  vendorId: string,
  vendorName: string,
  vendorRating: number,
  itemReviews?: {
    itemName: string
    rating: number
    title?: string
    comments?: string
  }[]
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
      "⚠️ AWS_ACCESS_KEY_ID not set. Skipping vendor new review email."
    )
    return { success: false, error: "Email provider key missing" }
  }

  const { default: VendorUser } = await import("@/models/VendorUser")
  const { default: dbConnect } = await import("@/lib/db")
  await dbConnect()

  const vendorUser = (await VendorUser.findOne({ vendorId }).lean()) as {
    email?: string
  } | null

  if (!vendorUser?.email) {
    console.warn(
      `[sendVendorNewReviewEmail] No email found for vendorId: ${vendorId}`
    )
    return { success: false, error: "Vendor email not found" }
  }

  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "no-reply@bitehubapp.com"
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/vendor/feedback`

  try {
    const html = await render(
      React.createElement(VendorNewReviewEmail, {
        vendorName,
        vendorRating,
        itemReviews,
        dashboardUrl,
      })
    )
    await mailer.sendMail({
      from: resolvedFrom,
      to: vendorUser.email,
      subject: `You received a new ${vendorRating}-star review!`,
      html: html,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send vendor new review alert email:", error)
    return { success: false, error }
  }
}
