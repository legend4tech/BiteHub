import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { subscribeSchema } from "@/lib/schemas"
import Subscriber from "@/models/Subscriber"
import { sendSubscriberWelcomeEmail } from "@/lib/mail"
import { generateUnsubscribeToken } from "@/lib/utils"
import { isRateLimitingEnabled, strictIpRateLimiter } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    if (isRateLimitingEnabled) {
      // Catch Upstash errors if mock/disconnected
      try {
        const { success } = await strictIpRateLimiter.limit(ip)
        if (!success) {
          return NextResponse.json(
            { error: "Too many requests" },
            { status: 429 }
          )
        }
      } catch (e) {
        console.error("Rate limit check failed, allowing request:", e)
      }
    }

    // 2. Parse & Validate
    const body = await req.json()
    const parsed = subscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      )
    }

    // 3. Connect to DB
    await dbConnect()

    // 4. Check if already subscribed
    const existing = await Subscriber.findOne({
      email: parsed.data.email,
    }).lean()
    if (existing) {
      if (!existing.isActive) {
        // Re-activate them
        await Subscriber.updateOne(
          { _id: existing._id },
          { isActive: true, subscribedAt: new Date() }
        )

        // Send welcome email again on resubscription
        await sendSubscriberWelcomeEmail(parsed.data.email)

        return NextResponse.json({
          success: true,
          message: "Subscribed successfully",
        })
      }

      // Already active
      const token = generateUnsubscribeToken(parsed.data.email)

      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed.",
        unsubscribeUrl: `/unsubscribe?email=${encodeURIComponent(parsed.data.email)}&token=${token}`,
      })
    }

    // 5. Create new subscriber
    await Subscriber.create({
      email: parsed.data.email,
      isActive: true,
      subscribedAt: new Date(),
    })

    // 6. Send Welcome Email
    await sendSubscriberWelcomeEmail(parsed.data.email)

    return NextResponse.json(
      { success: true, message: "Subscribed successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/subscribe]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
