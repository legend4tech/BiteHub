import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import React from "react"
import { z } from "zod"
import ContactAutoReply from "@/emails/ContactAutoReply"

const resend = new Resend(process.env.RESEND_API_KEY)

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(3, "Message is required"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input"
      return NextResponse.json({ message: firstError }, { status: 400 })
    }

    const { name, email, subject, message } = parsed.data

    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️ RESEND_API_KEY not set. Contact email not sent.")
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
      resend.emails.send({
        from: fromEmail,
        to: "contact@bitehubapp.com",
        replyTo: email,
        subject: `[Contact] ${subject}`,
        text: `Message from: ${name} (${email})\n\n${message}`,
      }),

      // 2. Auto-acknowledge the sender (non-critical — best effort)
      resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `We received your message — BiteHub Support`,
        react: React.createElement(ContactAutoReply, {
          senderName: name,
          subject,
          message,
        }),
      }),
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
