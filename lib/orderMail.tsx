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

import { render } from "@react-email/render"
import { mailer } from "./ses"
import React from "react"
import OrderReceiptEmail from "@/emails/OrderReceiptEmail"
import CustomerOrderInitiatedEmail from "@/emails/CustomerOrderInitiatedEmail"
import AdminOrderCancelledEmail from "@/emails/AdminOrderCancelledEmail"
import CustomerOrderStatusEmail from "@/emails/CustomerOrderStatusEmail"
import OrderCompletedEmail from "@/emails/OrderCompletedEmail"
import CustomerOrderCancelledEmail from "@/emails/CustomerOrderCancelledEmail"
import { NO_REPLY_EMAIL } from "./constants"

// ─── Shared helper ────────────────────────────────────────────────────────────

function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "no-reply@bitehubapp.com"
}

function missingKey() {
  console.warn("⚠️ AWS_ACCESS_KEY_ID is not defined in env.")
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
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
      "⚠️ AWS_ACCESS_KEY_ID is not defined in env. Order receipt logged:",
      trackingUrl
    )
    return { success: false, error: "Email provider key missing" }
  }
  try {
    const html = await render(
      React.createElement(OrderReceiptEmail, {
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
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: `Your BiteHub Receipt - Order ${orderId}`,
      html: html,
    })

    return { success: true }
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
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
      "⚠️ AWS_ACCESS_KEY_ID is not defined in env. Order initiated logged:",
      trackingUrl
    )
    return { success: false, error: "Email provider key missing" }
  }
  try {
    const html = await render(
      React.createElement(CustomerOrderInitiatedEmail, {
        customerName,
        orderId,
        vendorName,
        totalAmountInKobo,
        trackingUrl,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: `Action Required: Complete your BiteHub Order ${orderId}`,
      html: html,
    })

    return { success: true }
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
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  if (emails.length === 0) {
    return { success: false, error: "No admin emails provided" }
  }
  try {
    const html = await render(
      React.createElement(AdminOrderCancelledEmail, {
        orderId,
        vendorName,
        monnifyReference,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: emails,
      subject: `URGENT: Order Cancelled - Manual Refund Required (${orderId})`,
      html: html,
    })

    return { success: true }
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
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/order/${orderId}`
  try {
    const html = await render(
      React.createElement(CustomerOrderStatusEmail, {
        customerName,
        orderId,
        vendorName,
        statusLabel,
        statusDescription,
        trackingUrl,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: `Order Update: ${statusLabel}`,
      html: html,
    })

    return { success: true }
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
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/customer/reviews/new/${orderId}`
  try {
    const html = await render(
      React.createElement(OrderCompletedEmail, {
        customerName,
        orderId,
        vendorName,
        reviewUrl,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: `How was your food from ${vendorName}?`,
      html: html,
    })

    return { success: true }
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
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  try {
    const html = await render(
      React.createElement(CustomerOrderCancelledEmail, {
        customerName,
        orderId,
        vendorName,
      })
    )
    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: `Your BiteHub Order ${orderId} Was Cancelled`,
      html: html,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send customer order cancelled email:", error)
    return { success: false, error }
  }
}
