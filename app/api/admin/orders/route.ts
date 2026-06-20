import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { auth } from "@/auth"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    await dbConnect()

    const [orders, total] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments({}),
    ])

    const totalPages = Math.ceil(total / limit)

    const result = orders.map((o) => ({
      id: String(o._id),
      orderId: o.orderId,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      vendorName: o.vendorName,
      vendorWhatsappNumber: o.vendorWhatsappNumber,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
      items: o.items,
      createdAt: o.createdAt,
    }))

    return NextResponse.json({
      orders: result,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error("[admin/orders GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
