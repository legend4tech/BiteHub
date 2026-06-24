/**
 * authMail.ts
 *
 * Transactional email helpers for vendor and admin authentication flows.
 * Handles password resets, bank account setup/changes, and vendor onboarding.
 *
 * Consumed by:
 *  - app/api/vendor/auth/*   (password reset, bank change OTP)
 *  - app/api/admin/*         (admin password changed)
 *  - app/api/admin/vendors/* (vendor welcome on creation)
 */

import { Resend } from "resend"
import React from "react"
import ResetPasswordEmail from "@/emails/ResetPasswordEmail"
import BankSetupConfirmationEmail from "@/emails/BankSetupConfirmationEmail"
import BankChangeOtpEmail from "@/emails/BankChangeOtpEmail"
import BankChangeConfirmationEmail from "@/emails/BankChangeConfirmationEmail"
import AdminPasswordChangedEmail from "@/emails/AdminPasswordChangedEmail"
import VendorWelcomeEmail from "@/emails/VendorWelcomeEmail"
import { NO_REPLY_EMAIL } from "./constants"

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Shared helper ────────────────────────────────────────────────────────────

/** Resolves the correct "from" address for dev vs production. */
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

// ─── Auth Emails ──────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  vendorName: string,
  resetLink: string,
  expiryMinutes: number = 15
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "⚠️ RESEND_API_KEY is not defined in env. Logged reset link:",
      resetLink
    )
    return { success: false, error: "Email provider key missing" }
  }
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: "Reset your BiteHub vendor password",
      react: React.createElement(ResetPasswordEmail, {
        vendorName,
        resetLink,
        expiryMinutes,
      }),
    })
    if (error) {
      console.error("Resend API Error (Password Reset):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    return { success: false, error }
  }
}

export async function sendBankSetupConfirmationEmail(
  email: string,
  vendorName: string,
  bankName: string,
  accountNumber: string,
  lockDays: number
) {
  if (!process.env.RESEND_API_KEY) return missingKey()
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: "Your BiteHub Payout Bank Details Are Set Up",
      react: React.createElement(BankSetupConfirmationEmail, {
        vendorName,
        bankName,
        accountNumber,
        lockDays,
      }),
    })
    if (error) {
      console.error("Resend API Error (Bank Setup):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send bank setup confirmation email:", error)
    return { success: false, error }
  }
}

export async function sendBankChangeOtpEmail(
  email: string,
  vendorName: string,
  otp: string,
  expiryMinutes: number = 15
) {
  if (!process.env.RESEND_API_KEY) return missingKey()
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: `BiteHub Bank Update Verification Code: ${otp}`,
      react: React.createElement(BankChangeOtpEmail, {
        vendorName,
        otp,
        expiryMinutes,
      }),
    })
    if (error) {
      console.error("Resend API Error (Bank Change OTP):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send bank change OTP email:", error)
    return { success: false, error }
  }
}

export async function sendBankChangeConfirmationEmail(
  email: string,
  vendorName: string,
  bankName: string,
  accountNumber: string,
  lockDays: number
) {
  if (!process.env.RESEND_API_KEY) return missingKey()
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: "BiteHub Payout Bank Details Updated",
      react: React.createElement(BankChangeConfirmationEmail, {
        vendorName,
        bankName,
        accountNumber,
        lockDays,
      }),
    })
    if (error) {
      console.error("Resend API Error (Bank Change Confirmation):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send bank change confirmation email:", error)
    return { success: false, error }
  }
}

export async function sendAdminPasswordChangedEmail(
  email: string,
  adminName: string
) {
  if (!process.env.RESEND_API_KEY) return missingKey()
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: "Security Alert: Admin Password Changed",
      react: React.createElement(AdminPasswordChangedEmail, {
        adminName,
        email,
      }),
    })
    if (error) {
      console.error("Resend API Error (Admin Password Change):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send admin password change email:", error)
    return { success: false, error }
  }
}

export async function sendVendorWelcomeEmail(
  email: string,
  vendorName: string,
  passwordPlain: string
) {
  if (!process.env.RESEND_API_KEY) return missingKey()
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/vendor/dashboard`
  try {
    const { data, error } = await resend.emails.send({
      from: resolveFrom(),
      to: email,
      subject: `Welcome to BiteHub, ${vendorName}! 🚀`,
      react: React.createElement(VendorWelcomeEmail, {
        vendorName,
        email,
        passwordPlain,
        dashboardUrl,
      }),
    })
    if (error) {
      console.error("Resend API Error (Vendor Welcome Email):", error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send vendor welcome email:", error)
    return { success: false, error }
  }
}
