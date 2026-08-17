import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { auth } from "@/auth"
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS,
  OrderStatusType,
} from "@/lib/constants"

import { statusUpdateSchema } from "@/lib/schemas"

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
      !session.user?.vendorId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendorId = new Types.ObjectId(session.user.vendorId)
    const body = await request.json()

    const parsedBody = statusUpdateSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid status", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const { status } = parsedBody.data

    const order = await Order.findOne({ orderId: params.id, vendorId })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (
      order.paymentStatus === "pending" &&
      status !== ORDER_STATUS.CANCELLED
    ) {
      return NextResponse.json(
        { error: "Cannot process an unpaid order. You may only cancel it." },
        { status: 400 }
      )
    }

    const wasCancelled = order.status === ORDER_STATUS.CANCELLED
    const oldStatus = order.status
    order.status = status
    await order.save({ validateModifiedOnly: true })

    // Send customer email if email exists and status changed
    if (order.customerEmail && status !== oldStatus) {
      if (status === ORDER_STATUS.COMPLETED) {
        const { sendOrderCompletedEmail } = await import("@/lib/mail")
        // Fire and forget
        void sendOrderCompletedEmail(
          order.customerEmail,
          order.customerName,
          order.orderId,
          order.vendorName
        )
      } else {
        const { sendCustomerOrderStatusEmail } = await import("@/lib/mail")
        const statusConfig = ORDER_STATUS_CONFIG[status as OrderStatusType]
        if (statusConfig) {
          // Fire and forget
          void sendCustomerOrderStatusEmail(
            order.customerEmail,
            order.customerName,
            order.orderId,
            order.vendorName,
            statusConfig.label,
            statusConfig.description
          )
        }
      }
    }

    if (status === ORDER_STATUS.CANCELLED && !wasCancelled) {
      const { default: AdminUser } = await import("@/models/AdminUser")
      const { sendAdminOrderCancelledEmail } = await import("@/lib/mail")

      const admins = await AdminUser.find({ isActive: true })
        .select("email")
        .lean()
      const adminEmails = admins.map((a: { email: string }) => a.email)

      if (adminEmails.length > 0) {
        // Fire and forget
        void sendAdminOrderCancelledEmail(
          adminEmails,
          order.orderId,
          order.vendorName,
          order.monnifyReference || ""
        )
      }
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
