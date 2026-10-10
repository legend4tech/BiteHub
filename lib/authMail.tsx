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

import { render } from "@react-email/render"
import { mailer } from "./ses"
import ResetPasswordEmail from "@/emails/ResetPasswordEmail"
import BankSetupConfirmationEmail from "@/emails/BankSetupConfirmationEmail"
import BankChangeOtpEmail from "@/emails/BankChangeOtpEmail"
import BankChangeConfirmationEmail from "@/emails/BankChangeConfirmationEmail"
import AdminPasswordChangedEmail from "@/emails/AdminPasswordChangedEmail"
import VendorWelcomeEmail from "@/emails/VendorWelcomeEmail"
import CustomerWelcomeEmail from "@/emails/CustomerWelcomeEmail"
import { NO_REPLY_EMAIL } from "./constants"

// ─── Shared helper ────────────────────────────────────────────────────────────

/** Resolves the correct "from" address for dev vs production. */
function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "no-reply@bitehubapp.com"
}

function missingKey() {
  console.warn(
    "⚠️ AWS SES setup is missing (AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY)."
  )
  return { success: false, error: "Email provider key missing" }
}

// ─── Auth Emails ──────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  vendorName: string,
  resetLink: string,
  expiryMinutes: number = 15
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("⚠️ AWS credentials missing. Logged reset link:", resetLink)
    return { success: false, error: "Email provider key missing" }
  }
  try {
    const html = await render(
      <ResetPasswordEmail
        vendorName={vendorName}
        resetLink={resetLink}
        expiryMinutes={expiryMinutes}
      />
    )
    const info = await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "Reset your BiteHub vendor password",
      html,
    })
    return { success: true, data: info }
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    return { success: false, error }
  }
}

export async function sendCustomerPasswordResetEmail(
  email: string,
  customerName: string,
  resetLink: string,
  expiryMinutes: number = 15
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
      "⚠️ AWS credentials missing. Logged customer reset link:",
      resetLink
    )
    return { success: false, error: "Email provider key missing" }
  }
  try {
    const html = await render(
      <ResetPasswordEmail
        vendorName={customerName}
        resetLink={resetLink}
        expiryMinutes={expiryMinutes}
        userType="customer"
      />
    )
    const info = await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "Reset your BiteHub password",
      html,
    })
    return { success: true, data: info }
  } catch (error) {
    console.error("Failed to send customer password reset email:", error)
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
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  try {
    const html = await render(
      <BankSetupConfirmationEmail
        vendorName={vendorName}
        bankName={bankName}
        accountNumber={accountNumber}
        lockDays={lockDays}
      />
    )
    const info = await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "Your BiteHub Payout Bank Details Are Set Up",
      html,
    })
    return { success: true, data: info }
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
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  try {
    const html = await render(
      <BankChangeOtpEmail
        vendorName={vendorName}
        otp={otp}
        expiryMinutes={expiryMinutes}
      />
    )
    const info = await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: `BiteHub Bank Update Verification Code: ${otp}`,
      html,
    })
    return { success: true, data: info }
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
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  try {
    const html = await render(
      <BankChangeConfirmationEmail
        vendorName={vendorName}
        bankName={bankName}
        accountNumber={accountNumber}
        lockDays={lockDays}
      />
    )
    const info = await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "BiteHub Payout Bank Details Updated",
      html,
    })
    return { success: true, data: info }
  } catch (error) {
    console.error("Failed to send bank change confirmation email:", error)
    return { success: false, error }
  }
}

export async function sendAdminPasswordChangedEmail(
  email: string,
  adminName: string
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  try {
    const html = await render(
      <AdminPasswordChangedEmail adminName={adminName} email={email} />
    )
    const info = await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "Security Alert: Admin Password Changed",
      html,
    })
    return { success: true, data: info }
  } catch (error) {
    console.error("Failed to send admin password change notification:", error)
    return { success: false, error }
  }
}

export async function sendCustomerWelcomeEmail(
  email: string,
  customerName: string
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  try {
    const html = await render(
      <CustomerWelcomeEmail
        customerName={customerName}
        dashboardUrl={
          process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"
        }
      />
    )
    const info = await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: `Welcome to BiteHub, ${customerName}! 🍕`,
      html,
    })
    return { success: true, data: info }
  } catch (error) {
    console.error("Failed to send customer welcome email:", error)
    return { success: false, error }
  }
}

export async function sendVendorWelcomeEmail(
  email: string,
  vendorName: string,
  passwordPlain: string
) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    return missingKey()
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/vendor/dashboard`
  try {
    const html = await render(
      <VendorWelcomeEmail
        vendorName={vendorName}
        email={email}
        passwordPlain={passwordPlain}
        dashboardUrl={dashboardUrl}
      />
    )
    const info = await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: `Welcome to BiteHub, ${vendorName}! 🚀`,
      html,
    })
    return { success: true, data: info }
  } catch (error) {
    console.error("Failed to send vendor welcome email:", error)
    return { success: false, error }
  }
}
