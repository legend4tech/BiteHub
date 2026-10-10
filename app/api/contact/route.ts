import { NextRequest, NextResponse } from "next/server"
import { render } from "@react-email/render"
import { mailer } from "@/lib/ses"
import React from "react"
import ContactAutoReply from "@/emails/ContactAutoReply"
import { CONTACT_EMAIL } from "@/lib/constants"

import { contactSchema } from "@/lib/schemas"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input"
      return NextResponse.json({ message: firstError }, { status: 400 })
    }

    const { name, email, subject, message } = parsed.data

    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(`contact_${email}`)
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn("⚠️ AWS_ACCESS_KEY_ID not set. Contact email not sent.")
      return NextResponse.json(
        { message: "Email service not configured." },
        { status: 503 }
      )
    }

    const fromEmail =
      process.env.EMAIL_FROM || "BiteHub <no-reply@mail.bitehubapp.com>"

    // Send both emails — use allSettled so one failure doesn't kill the other
    const [notifyResult, autoReplyResult] = await Promise.allSettled([
      // 1. Notify BiteHub inbox with full message details (critical — must arrive)
      mailer.sendMail({
        from: fromEmail,
        to: CONTACT_EMAIL,
        replyTo: email,
        subject: `[Contact] ${subject}`,
        text: `Message from: ${name} (${email})\n\n${message}`,
      }),

      // 2. Auto-acknowledge the sender (non-critical — best effort)
      render(
        React.createElement(ContactAutoReply, {
          senderName: name,
          subject,
          message,
        })
      ).then((html) =>
        mailer.sendMail({
          from: fromEmail,
          to: email,
          subject: `We received your message — BiteHub Support`,
          html,
        })
      ),
    ])

    // If the main notification failed, that's a real error
    if (notifyResult.status === "rejected") {
      console.error(
        "[contact] Failed to send inbox notification:",
        notifyResult.reason
      )
      return NextResponse.json(
        { message: "Failed to send message. Please try again." },
        { status: 500 }
      )
    }

    // Auto-reply failure is non-critical — log it but still return success
    if (autoReplyResult.status === "rejected") {
      console.warn(
        "[contact] Auto-reply failed (non-critical):",
        autoReplyResult.reason
      )
    }

    return NextResponse.json({ message: "Message sent successfully." })
  } catch (error) {
    console.error("[contact POST]", error)
    return NextResponse.json(
      { message: "Failed to send message. Please try again." },
      { status: 500 }
    )
  }
}
