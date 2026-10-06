import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { auth } from "@/auth"
import { serializeOrder } from "@/lib/serializers"
import { createOrderSchema } from "@/lib/schemas"
import { processCheckout } from "@/lib/services/checkoutService"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"

export async function GET(request: Request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      )
    }

    const order = await Order.findOne({ orderId }).lean()

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const serializedOrder = serializeOrder(order)
    return NextResponse.json(serializedOrder)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}

// ── POST /api/orders

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request body using Zod
    const parsedBody = createOrderSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const session = await auth()

    if (isRateLimitingEnabled) {
      const rateLimitKey = session?.user?.id
        ? `order_user_${session.user.id}`
        : `order_email_${parsedBody.data.customerEmail}`

      const { success } = await strictRateLimiter.limit(rateLimitKey)
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    // Connect to DB only AFTER validation and auth (Rule 8)
    await dbConnect()

    const result = await processCheckout(parsedBody.data, session)

    if (result.error !== undefined) {
      return NextResponse.json(result, { status: result.status })
    }

    return NextResponse.json(
      {
        orderId: result.orderId,
        checkoutUrl: result.checkoutUrl,
        transactionReference: result.transactionReference,
      },
      { status: result.status }
    )
  } catch (error) {
    console.error("[POST /api/orders] Error creating order:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}
