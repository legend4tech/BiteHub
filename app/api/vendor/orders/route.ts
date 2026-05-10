import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { auth } from "@/auth";
import { serializeOrder } from "@/lib/serializers";

/**
 * GET /api/vendor/orders
 * Returns all orders for the authenticated vendor, sorted newest first.
 * Optionally accepts ?status=pending|confirmed|preparing|ready|completed|cancelled
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "vendor" || !(session.user as any)?.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const vendorId = new Types.ObjectId((session.user as any).vendorId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: Record<string, any> = { vendorId };
    if (status && status !== "all") {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(orders.map(serializeOrder));
  } catch (error) {
    console.error("[vendor/orders GET]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

/**
 * PATCH /api/vendor/orders/[id]
 * Update an order status. Handled per-order in a separate route file.
 */
