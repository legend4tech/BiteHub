import { NextResponse } from "next/server"
import crypto from "crypto"
import { sendWhatsappText } from "@/lib/whatsapp"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  if (!verifyToken) {
    console.error("[WhatsApp Webhook] Missing WHATSAPP_WEBHOOK_VERIFY_TOKEN")
    return new NextResponse("Forbidden", { status: 403 })
  }

  if (mode && token) {
    const tokenBuf = Buffer.from(token)
    const verifyBuf = Buffer.from(verifyToken)
    if (
      mode === "subscribe" &&
      tokenBuf.length === verifyBuf.length &&
      crypto.timingSafeEqual(tokenBuf, verifyBuf)
    ) {
      return new NextResponse(challenge || "", { status: 200 })
    } else {
      return new NextResponse("Forbidden", { status: 403 })
    }
  }
  return new NextResponse("Bad Request", { status: 400 })
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()

    const appSecret = process.env.WHATSAPP_APP_SECRET
    if (appSecret) {
      const signatureHeader = req.headers.get("x-hub-signature-256")
      if (!signatureHeader) {
        console.error("[WhatsApp Webhook] Missing x-hub-signature-256 header")
        return new NextResponse("Forbidden", { status: 403 })
      }
      const signature = signatureHeader.startsWith("sha256=")
        ? signatureHeader.slice(7)
        : signatureHeader

      const computedHash = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex")

      const sigBuf = Buffer.from(signature, "hex")
      const compBuf = Buffer.from(computedHash, "hex")

      if (
        sigBuf.length !== compBuf.length ||
        !crypto.timingSafeEqual(sigBuf, compBuf)
      ) {
        console.error("[WhatsApp Webhook] Invalid signature rejected")
        return new NextResponse("Forbidden", { status: 403 })
      }
    }

    const body = JSON.parse(rawBody)
    // Check if this is an event from a WhatsApp API
    if (body.object === "whatsapp_business_account") {
      // Loop through all entries
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value
          // Handle incoming messages
          if (value && value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              // Only auto-reply to user text messages or standard media to avoid infinite loops with system messages
              if (
                message.type === "text" ||
                message.type === "image" ||
                message.type === "audio"
              ) {
                const autoReplyMessage =
                  "Hi there! 👋 You have reached the BiteHub automated notification system.\n\nWe do not monitor this inbox for replies. If you need help with an order, or have any questions, please contact our support team at support@bitehub.com or visit our website.\n\nThank you!"
                // Await the reply so Vercel doesn't kill the function before it sends
                try {
                  await sendWhatsappText(message.from, autoReplyMessage)
                } catch (err) {
                  console.error("Failed to send auto-reply in webhook:", err)
                }
              }
            }
          }
          // Handle message status updates (sent, delivered, read, failed)
          if (value && value.statuses && value.statuses.length > 0) {
            value.statuses.forEach(() => {
              // TODO: Update your database to reflect the delivery status of the message
            })
          }
        }
      }
      // Return a '200 OK' response to all requests
      // This is crucial! WhatsApp will retry if you don't respond with 200
      return new NextResponse("EVENT_RECEIVED", { status: 200 })
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      return new NextResponse("Not Found", { status: 404 })
    }
  } catch (error) {
    console.error("Error processing webhook payload:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
