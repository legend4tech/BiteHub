import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import { auth } from "@/auth";
import { serializeMenuItem } from "@/lib/serializers";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "vendor" || !(session.user as any)?.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const vendorId = new Types.ObjectId((session.user as any).vendorId);

    const item = await MenuItem.findOne({ _id: id, vendorId }).lean();

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json(serializeMenuItem(item));
  } catch (error) {
    console.error("[vendor/menu GET single]", error);
    return NextResponse.json({ error: "Failed to fetch menu item" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "vendor" || !(session.user as any)?.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const vendorId = new Types.ObjectId((session.user as any).vendorId);
    const body = await request.json();

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, vendorId },
      { $set: body },
      { new: true }
    ).lean();

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json(serializeMenuItem(item));
  } catch (error) {
    console.error("[vendor/menu PATCH]", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user?.role !== "vendor" || !(session.user as any)?.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const vendorId = new Types.ObjectId((session.user as any).vendorId);

    const item = await MenuItem.findOneAndDelete({ _id: id, vendorId });

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[vendor/menu DELETE]", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
