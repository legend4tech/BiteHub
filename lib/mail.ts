import { Resend } from "resend"
import ResetPasswordEmail from "@/emails/ResetPasswordEmail"
import BankSetupConfirmationEmail from "@/emails/BankSetupConfirmationEmail"
import BankChangeOtpEmail from "@/emails/BankChangeOtpEmail"
import BankChangeConfirmationEmail from "@/emails/BankChangeConfirmationEmail"
import OrderReceiptEmail from "@/emails/OrderReceiptEmail"
import VendorNewOrderEmail from "@/emails/VendorNewOrderEmail"
import React from "react"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(
  email: string,
  vendorName: string,
  resetLink: string,
  expiryMinutes: number = 15
) {
  const fromEmail =
    process.env.EMAIL_FROM || "BiteHub <no-reply@bitehubapp.com>"

  // Resend requires verified domains in production. In development without a verified domain,
  // we fallback to their testing sandbox onboarding address if EMAIL_FROM isn't configured.
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "⚠️ RESEND_API_KEY is not defined in env. Logged reset link:",
      resetLink
    )
    return { success: false, error: "Email provider key missing" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
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
  const fromEmail =
    process.env.EMAIL_FROM || "BiteHub <no-reply@bitehubapp.com>"
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env.")
    return { success: false, error: "Email provider key missing" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
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
  const fromEmail =
    process.env.EMAIL_FROM || "BiteHub <no-reply@bitehubapp.com>"
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env.")
    return { success: false, error: "Email provider key missing" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
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
  const fromEmail =
    process.env.EMAIL_FROM || "BiteHub <no-reply@bitehubapp.com>"
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env.")
    return { success: false, error: "Email provider key missing" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
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

export async function sendOrderReceiptEmail(
  email: string,
  customerName: string,
  orderId: string,
  vendorName: string,
  totalAmount: number,
  deliveryFee: number,
  serviceFee: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  trackingUrl: string
) {
  const fromEmail =
    process.env.EMAIL_FROM || "BiteHub <no-reply@bitehubapp.com>"
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "⚠️ RESEND_API_KEY is not defined in env. Order receipt logged:",
      trackingUrl
    )
    return { success: false, error: "Email provider key missing" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
      to: email,
      subject: `Your BiteHub Receipt - Order ${orderId}`,
      react: React.createElement(OrderReceiptEmail, {
        customerName,
        orderId,
        vendorName,
        totalAmount,
        deliveryFee,
        serviceFee,
        items,
        trackingUrl,
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

export async function sendAdminPasswordChangedEmail(
  email: string,
  adminName: string
) {
  const fromEmail =
    process.env.EMAIL_FROM || "BiteHub <no-reply@bitehubapp.com>"
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env.")
    return { success: false, error: "Email provider key missing" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
      to: email,
      subject: "Security Alert: Admin Password Changed",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Security Alert</h2>
          <p>Hi ${adminName},</p>
          <p>The password for your BiteHub Admin account (<strong>${email}</strong>) was just changed.</p>
          <p>If you made this change, you can safely ignore this email.</p>
          <p style="color: red; font-weight: bold;">If you did NOT make this change, please contact your security team or reset your password immediately.</p>
          <br/>
          <p>Best regards,<br/>BiteHub Security Team</p>
        </div>
      `,
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
  notes?: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not set. Skipping vendor order email.")
    return { success: false, error: "Email provider key missing" }
  }

  // Resolve vendor email from VendorUser by vendorId — no schema changes needed
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

  const fromEmail =
    process.env.EMAIL_FROM || "BiteHub <no-reply@bitehubapp.com>"
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/vendor/dashboard`

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
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
