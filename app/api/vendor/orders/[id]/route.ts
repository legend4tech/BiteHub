import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { auth } from "@/auth";

/**
 * PATCH /api/vendor/orders/[id]
 * Updates the status of a specific order. Only the owning vendor can do this.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "vendor" || !(session.user as any)?.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const vendorId = new Types.ObjectId((session.user as any).vendorId);
    const { status } = await request.json();

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await Order.findOneAndUpdate(
      { _id: params.id, vendorId },
      { $set: { status } },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: order.status });
  } catch (error) {
    console.error("[vendor/orders PATCH]", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
