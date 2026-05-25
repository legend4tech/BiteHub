import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"

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

    if (body.paymentStatus !== "transferred") {
      return NextResponse.json(
        { error: "Invalid payment status" },
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
