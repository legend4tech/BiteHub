import { NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import { serializeOrder } from "@/lib/serializers"
import type { LeanOrder } from "@/lib/serializers"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    await dbConnect()

    const [orders, totalOrders] = await Promise.all([
      Order.find({ customerEmail: session.user.email })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ customerEmail: session.user.email }),
    ])

    const serializedOrders = orders.map((order) =>
      serializeOrder(order as unknown as LeanOrder)
    )

    return NextResponse.json({
      orders: serializedOrders,
      page,
      hasMore: skip + orders.length < totalOrders,
      totalOrders,
    })
  } catch (error) {
    console.error("[GET /api/customer/orders] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch customer orders" },
      { status: 500 }
    )
  }
}
