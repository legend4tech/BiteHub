/**
 * subscriberMail.tsx
 *
 * Transactional email helpers for newsletter subscribers.
 */

import { render } from "@react-email/render"
import { mailer } from "./ses"
import SubscriberWelcomeEmail from "@/emails/SubscriberWelcomeEmail"
import { NO_REPLY_EMAIL } from "./constants"

function resolveFrom() {
  const configured = process.env.EMAIL_FROM || `BiteHub <${NO_REPLY_EMAIL}>`
  return process.env.NODE_ENV === "production"
    ? configured
    : process.env.EMAIL_FROM || "no-reply@bitehubapp.com"
}

export async function sendSubscriberWelcomeEmail(email: string) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
      "⚠️ AWS credentials missing. Would have sent welcome email to:",
      email
    )
    return { success: false, error: "Email provider key missing" }
  }

  try {
    const html = await render(<SubscriberWelcomeEmail />)

    await mailer.sendMail({
      from: resolveFrom(),
      to: email,
      subject: "Welcome to BiteHub! 🚀",
      html,
    })
    return { success: true }
  } catch (error) {
    console.error("[sendSubscriberWelcomeEmail] Error sending email:", error)
    return { success: false, error: "Failed to send email" }
  }
}
