/**
 * orderMail.ts
 *
 * Transactional email helpers for the customer and admin order lifecycle.
 * Covers order initiation, receipts, status updates, completion, and cancellation.
 *
 * Consumed by:
 *  - app/api/orders/route.ts          (initiation)
 *  - app/api/orders/[id]/confirm/*    (receipt after payment)
 *  - app/api/vendor/orders/*          (status updates, completion)
 *  - app/api/cron/release-quantity/*  (cancellation)
 */

import { Resend } from "resend"
import React from "react"
import OrderReceiptEmail from "@/emails/OrderReceiptEmail"
import CustomerOrderInitiatedEmail from "@/emails/CustomerOrderInitiatedEmail"
import AdminOrderCancelledEmail from "@/emails/AdminOrderCancelledEmail"
import CustomerOrderStatusEmail from "@/emails/CustomerOrderStatusEmail"
import OrderCompletedEmail from "@/emails/OrderCompletedEmail"
import CustomerOrderCancelledEmail from "@/emails/CustomerOrderCancelledEmail"
import { NO_REPLY_EMAIL } from "./constants"

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Shared helper ────────────────────────────────────────────────────────────

function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "onboarding@resend.dev"
}

function missingKey() {
  console.warn("⚠️ RESEND_API_KEY is not defined in env.")
  return { success: false, error: "Email provider key missing" }
}

// ─── Order Emails ─────────────────────────────────────────────────────────────

export async function sendOrderReceiptEmail(
  email: string,
  customerName: string,
  orderId: string,
  vendorName: string,
  totalAmountInKobo: number,
  deliveryFeeInKobo: number,
  serviceFeeInKobo: number,
  items: Array<{ name: string; quantity: number; priceInKobo: number }>,
  trackingUrl: string,
  paymentMethod?: string,
  discountAmountInKobo?: number
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "⚠️ RESEND_API_KEY is not defined in env. Order receipt logged:",
      trackingUrl
    )
    return { success: false, error: "Email provider key missing" }
  }
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: `Your BiteHub Receipt - Order ${orderId}`,
      react: React.createElement(OrderReceiptEmail, {
        customerName,
        orderId,
        vendorName,
        totalAmountInKobo,
        deliveryFeeInKobo,
        serviceFeeInKobo,
        items,
        trackingUrl,
        paymentMethod,
        discountAmountInKobo,
      }),
    })
    if (error) {
      console.error("Resend API Error (Order Receipt):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send order receipt email:", error)
    return { success: false, error }
  }
}

export async function sendOrderInitiatedEmail(
  email: string,
  customerName: string,
  orderId: string,
  vendorName: string,
  totalAmountInKobo: number,
  trackingUrl: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "⚠️ RESEND_API_KEY is not defined in env. Order initiated logged:",
      trackingUrl
    )
    return { success: false, error: "Email provider key missing" }
  }
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: `Action Required: Complete your BiteHub Order ${orderId}`,
      react: React.createElement(CustomerOrderInitiatedEmail, {
        customerName,
        orderId,
        vendorName,
        totalAmountInKobo,
        trackingUrl,
      }),
    })
    if (error) {
      console.error("Resend API Error (Order Initiated):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send order initiated email:", error)
    return { success: false, error }
  }
}

export async function sendAdminOrderCancelledEmail(
  emails: string[],
  orderId: string,
  vendorName: string,
  monnifyReference: string
) {
  if (!process.env.RESEND_API_KEY) return missingKey()
  if (emails.length === 0) {
    return { success: false, error: "No admin emails provided" }
  }
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: emails,
      subject: `URGENT: Order Cancelled - Manual Refund Required (${orderId})`,
      react: React.createElement(AdminOrderCancelledEmail, {
        orderId,
        vendorName,
        monnifyReference,
      }),
    })
    if (error) {
      console.error("Resend API Error (Admin Order Cancelled):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send admin order cancelled email:", error)
    return { success: false, error }
  }
}

export async function sendCustomerOrderStatusEmail(
  email: string,
  customerName: string,
  orderId: string,
  vendorName: string,
  statusLabel: string,
  statusDescription: string
) {
  if (!process.env.RESEND_API_KEY) return missingKey()
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/order/${orderId}`
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: `Order Update: ${statusLabel}`,
      react: React.createElement(CustomerOrderStatusEmail, {
        customerName,
        orderId,
        vendorName,
        statusLabel,
        statusDescription,
        trackingUrl,
      }),
    })
    if (error) {
      console.error("Resend API Error (Customer Order Status):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send customer order status email:", error)
    return { success: false, error }
  }
}

export async function sendOrderCompletedEmail(
  email: string,
  customerName: string,
  orderId: string,
  vendorName: string
) {
  if (!process.env.RESEND_API_KEY) return missingKey()
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/customer/reviews/new/${orderId}`
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: `How was your food from ${vendorName}?`,
      react: React.createElement(OrderCompletedEmail, {
        customerName,
        orderId,
        vendorName,
        reviewUrl,
      }),
    })
    if (error) {
      console.error("Resend API Error (Order Completed Email):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send order completed email:", error)
    return { success: false, error }
  }
}

export async function sendCustomerOrderCancelledEmail(
  email: string,
  customerName: string,
  orderId: string,
  vendorName: string
) {
  if (!process.env.RESEND_API_KEY) return missingKey()
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: `Your BiteHub Order ${orderId} Was Cancelled`,
      react: React.createElement(CustomerOrderCancelledEmail, {
        customerName,
        orderId,
        vendorName,
      }),
    })
    if (error) {
      console.error("Resend API Error (Customer Order Cancelled):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send customer order cancelled email:", error)
    return { success: false, error }
  }
}
