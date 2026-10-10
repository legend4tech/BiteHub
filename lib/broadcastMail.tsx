import { render } from "@react-email/render"
import { mailer } from "./ses"
import BroadcastEmail from "@/emails/BroadcastEmail"
import { APP_BASE_URL, NO_REPLY_EMAIL, APP_NAME } from "./constants"
import { generateUnsubscribeToken } from "./utils"
import * as React from "react"

export async function sendBroadcastEmails(
  emails: string[],
  subject: string,
  htmlContent: string,
  adminEmail?: string
) {
  if (emails.length === 0) return { success: true, count: 0 }

  const baseHtml = await render(
    <BroadcastEmail subject={subject} htmlContent={htmlContent} />
  )

  const fromStr = process.env.EMAIL_FROM || `${APP_NAME} <${NO_REPLY_EMAIL}>`

  // SES rate limit is 14/sec. We use batches of 10 to be safe.
  const BATCH_SIZE = 10
  const BATCH_DELAY_MS = 1000

  try {
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)

      const sendPromises = batch.map(async (email) => {
        const token = generateUnsubscribeToken(email)
        const unsubLink = `${APP_BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`

        const personalizedHtml = baseHtml.replace(
          "{{UNSUBSCRIBE_LINK}}",
          unsubLink
        )

        return mailer
          .sendMail({
            from: fromStr,
            to: email,
            subject,
            html: personalizedHtml,
          })
          .catch((err) => {
            console.error(`Failed to send broadcast to ${email}:`, err)
          })
      })

      await Promise.all(sendPromises)

      // Wait 1 second before processing the next batch if there are more emails
      if (i + BATCH_SIZE < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    if (adminEmail) {
      await mailer
        .sendMail({
          from: fromStr,
          to: adminEmail,
          subject: `✅ Broadcast Complete: ${subject}`,
          html: `<p>Good news! Your broadcast <strong>"${subject}"</strong> has successfully finished sending to ${emails.length} recipients.</p>`,
        })
        .catch(console.error)
    }

    return { success: true, count: emails.length }
  } catch (error: unknown) {
    console.error("[sendBroadcastEmails Error]:", error)
    if (adminEmail) {
      await mailer
        .sendMail({
          from: fromStr,
          to: adminEmail,
          subject: `❌ Broadcast Failed: ${subject}`,
          html: `<p>Your broadcast stopped unexpectedly.</p><p>Error: ${error instanceof Error ? error.message : String(error)}</p>`,
        })
        .catch(console.error)
    }
    throw error
  }
}
