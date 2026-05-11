import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { auth } from "@/auth"
import { VALID_ORDER_STATUSES } from "@/lib/constants"
import { z } from "zod"

const statusUpdateSchema = z.object({
  status: z.enum(VALID_ORDER_STATUSES),
})

/**
 * PATCH /api/vendor/orders/[id]
 * Updates the status of a specific order. Only the owning vendor can do this.
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
      !(session.user as any)?.vendorId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendorId = new Types.ObjectId((session.user as any).vendorId)
    const body = await request.json()
    
    const parsedBody = statusUpdateSchema.safeParse(body)
    
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid status", details: parsedBody.error.format() }, { status: 400 })
    }

    const { status } = parsedBody.data

    const order = await Order.findOneAndUpdate(
      { orderId: params.id, vendorId },
      { $set: { status } },
      { new: true }
    )

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, status: order.status })
  } catch (error) {
    console.error("[vendor/orders PATCH]", error)
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    )
  }
}
