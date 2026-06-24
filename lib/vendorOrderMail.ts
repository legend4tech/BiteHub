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

import { Resend } from "resend"
import React from "react"
import VendorNewOrderEmail from "@/emails/VendorNewOrderEmail"
import { NO_REPLY_EMAIL } from "./constants"

const resend = new Resend(process.env.RESEND_API_KEY)

function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "onboarding@resend.dev"
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
  items: Array<{ name: string; quantity: number; price: number }>,
  deliveryFee: number,
  serviceFee: number,
  totalAmount: number,
  vendorRevenue: number,
  platformCommission: number,
  notes?: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not set. Skipping vendor order email.")
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
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: vendorUser.email,
      subject: `New Order ${orderId} — ${customerName} ordered from you`,
      react: React.createElement(VendorNewOrderEmail, {
        vendorName,
        orderId,
        customerName,
        customerPhone,
        deliveryLocation,
        items,
        deliveryFee,
        serviceFee,
        platformCommission,
        totalAmount,
        vendorRevenue,
        notes,
        dashboardUrl,
      }),
    })
    if (error) {
      console.error("Resend API Error (Vendor New Order):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send vendor new order email:", error)
    return { success: false, error }
  }
}
