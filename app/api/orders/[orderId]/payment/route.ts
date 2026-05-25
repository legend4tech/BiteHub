import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { orderPaymentStatusSchema } from "@/lib/schemas"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await dbConnect()
    const { orderId } = await params
    const body = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    const parsedBody = orderPaymentStatusSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    if (parsedBody.data.paymentStatus !== "transferred") {
      return NextResponse.json(
        { error: "Invalid payment status. Only 'transferred' is allowed." },
        { status: 400 }
      )
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { $set: { paymentStatus: "transferred" } },
      { new: true }
    )

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      paymentStatus: order.paymentStatus,
    })
  } catch (error) {
    console.error("[PATCH /api/orders/[orderId]/payment]", error)
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    )
  }
}
