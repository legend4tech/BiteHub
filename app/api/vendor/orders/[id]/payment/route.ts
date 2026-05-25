import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { auth } from "@/auth"
import { orderPaymentStatusSchema } from "@/lib/schemas"

/**
 * PATCH /api/vendor/orders/[id]/payment
 * Allows a vendor to confirm payment for a transferred order.
 */
export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const session = await auth()
    if (
      !session ||
      session.user?.role !== "vendor" ||
      !session.user?.vendorId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendorId = new Types.ObjectId(session.user.vendorId)
    const body = await request.json()

    const parsedBody = orderPaymentStatusSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    if (parsedBody.data.paymentStatus !== "confirmed") {
      return NextResponse.json(
        { error: "Invalid payment status. Only 'confirmed' is allowed." },
        { status: 400 }
      )
    }

    const order = await Order.findOneAndUpdate(
      { orderId: params.id, vendorId, paymentStatus: "transferred" },
      {
        $set: {
          paymentStatus: "confirmed",
          status: "confirmed",
        },
      },
      { new: true }
    )

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or payment not in 'transferred' state." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentStatus: order.paymentStatus,
    })
  } catch (error) {
    console.error("[vendor/orders/payment PATCH]", error)
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    )
  }
}
