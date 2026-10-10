/**
 * mail.ts — Re-export barrel
 *
 * This file is the public API surface for all transactional email helpers.
 * Import from here throughout the codebase so callers never need to know
 * which sub-module owns a specific function.
 *
 * Actual implementations live in focused sub-modules (§3 — 450-line limit):
 *  - lib/authMail.ts        — vendor/admin auth and onboarding emails
 *  - lib/orderMail.ts       — customer and admin order lifecycle emails
 *  - lib/vendorOrderMail.ts — vendor-facing order notification emails
 *  - lib/vendorAlertMail.ts — vendor operational alerts (low stock, etc.)
 */

export {
  sendPasswordResetEmail,
  sendCustomerPasswordResetEmail,
  sendBankSetupConfirmationEmail,
  sendBankChangeOtpEmail,
  sendBankChangeConfirmationEmail,
  sendAdminPasswordChangedEmail,
  sendVendorWelcomeEmail,
} from "./authMail"

export {
  sendOrderReceiptEmail,
  sendOrderInitiatedEmail,
  sendAdminOrderCancelledEmail,
  sendCustomerOrderStatusEmail,
  sendOrderCompletedEmail,
  sendCustomerOrderCancelledEmail,
} from "./orderMail"

export { sendVendorNewOrderEmail } from "./vendorOrderMail"

export { sendVendorLowStockAlertEmail } from "./vendorAlertMail"

export { sendSubscriberWelcomeEmail } from "./subscriberMail"
