/**
 * vendorOrderMail.ts
 *
 * Transactional email helpers for vendor-facing order notifications.
 * Notifies vendors when a new paid order arrives, including a full
 * financial breakdown (revenue, commission, delivery fee).
 *
 * Consumed by:
 *  - app/api/orders/[id]/confirm/* (after Monnify payment webhook confirms)
 */

import { render } from "@react-email/render"
import { mailer } from "./ses"
import React from "react"
import VendorNewOrderEmail from "@/emails/VendorNewOrderEmail"
import { NO_REPLY_EMAIL } from "./constants"

function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "no-reply@bitehubapp.com"
}

// ─── Vendor Order Emails ──────────────────────────────────────────────────────

/**
 * Sends a new-order notification to the vendor with a full financial breakdown.
 * The vendor's email is resolved from VendorUser by vendorId — no email is
 * accepted from the client to prevent spoofing.
 */
export async function sendVendorNewOrderEmail(
  vendorId: string,
  vendorName: string,
  orderId: string,
  customerName: string,
  customerPhone: string,
  deliveryLocation: string,
  items: Array<{ name: string; quantity: number; priceInKobo: number }>,
  deliveryFeeInKobo: number,
  serviceFeeInKobo: number,
  totalAmountInKobo: number,
  vendorRevenueInKobo: number,
  platformCommissionInKobo: number,
  notes?: string
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("⚠️ AWS_ACCESS_KEY_ID not set. Skipping vendor order email.")
    return { success: false, error: "Email provider key missing" }
  }

  // Resolve vendor email server-side — no schema changes needed
  const { default: VendorUser } = await import("@/models/VendorUser")
  const { default: dbConnect } = await import("@/lib/db")
  await dbConnect()
  const vendorUser = (await VendorUser.findOne({ vendorId }).lean()) as {
    email?: string
  } | null

  if (!vendorUser?.email) {
    console.warn(
      `[sendVendorNewOrderEmail] No email found for vendorId: ${vendorId}`
    )
    return { success: false, error: "Vendor email not found" }
  }

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/vendor/dashboard`

  try {
    const html = await render(
      React.createElement(VendorNewOrderEmail, {
        vendorName,
        orderId,
        customerName,
        customerPhone,
        deliveryLocation,
        items,
        deliveryFeeInKobo,
        serviceFeeInKobo,
        platformCommissionInKobo,
        totalAmountInKobo,
        vendorRevenueInKobo,
        notes,
        dashboardUrl,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: vendorUser.email,
      subject: `New Order ${orderId} — ${customerName} ordered from you`,
      html: html,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send vendor new order email:", error)
    return { success: false, error }
  }
}
