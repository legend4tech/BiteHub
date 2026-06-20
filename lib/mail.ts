import { Resend } from "resend"
import ResetPasswordEmail from "@/emails/ResetPasswordEmail"
import BankSetupConfirmationEmail from "@/emails/BankSetupConfirmationEmail"
import BankChangeOtpEmail from "@/emails/BankChangeOtpEmail"
import BankChangeConfirmationEmail from "@/emails/BankChangeConfirmationEmail"
import OrderReceiptEmail from "@/emails/OrderReceiptEmail"
import VendorNewOrderEmail from "@/emails/VendorNewOrderEmail"
import CustomerOrderInitiatedEmail from "@/emails/CustomerOrderInitiatedEmail"
import AdminPasswordChangedEmail from "@/emails/AdminPasswordChangedEmail"
import AdminOrderCancelledEmail from "@/emails/AdminOrderCancelledEmail"
import CustomerOrderStatusEmail from "@/emails/CustomerOrderStatusEmail"
import OrderCompletedEmail from "@/emails/OrderCompletedEmail"
import VendorWelcomeEmail from "@/emails/VendorWelcomeEmail"
import { NO_REPLY_EMAIL } from "./constants"
import React from "react"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(
  email: string,
  vendorName: string,
  resetLink: string,
  expiryMinutes: number = 15
) {
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`

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
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
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
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
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
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
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
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
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
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
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

  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
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

export async function sendOrderInitiatedEmail(
  email: string,
  customerName: string,
  orderId: string,
  vendorName: string,
  totalAmount: number,
  trackingUrl: string
) {
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "⚠️ RESEND_API_KEY is not defined in env. Order initiated logged:",
      trackingUrl
    )
    return { success: false, error: "Email provider key missing" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
      to: email,
      subject: `Action Required: Complete your BiteHub Order ${orderId}`,
      react: React.createElement(CustomerOrderInitiatedEmail, {
        customerName,
        orderId,
        vendorName,
        totalAmount,
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
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env.")
    return { success: false, error: "Email provider key missing" }
  }

  if (emails.length === 0) {
    return { success: false, error: "No admin emails provided" }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
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
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env.")
    return { success: false, error: "Email provider key missing" }
  }

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/order/${orderId}`

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
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
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env.")
    return { success: false, error: "Email provider key missing" }
  }

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/order/${orderId}`

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
      to: email,
      subject: `How was your food from ${vendorName}?`,
      react: React.createElement(OrderCompletedEmail, {
        customerName,
        orderId,
        vendorName,
        trackingUrl,
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

export async function sendVendorWelcomeEmail(
  email: string,
  vendorName: string,
  passwordPlain: string
) {
  const fromEmail = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  const resolvedFrom =
    process.env.NODE_ENV === "production"
      ? fromEmail
      : process.env.EMAIL_FROM || "onboarding@resend.dev"

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env.")
    return { success: false, error: "Email provider key missing" }
  }

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/vendor/dashboard`

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
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
