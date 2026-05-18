import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import { auth } from "@/auth";
import { serializeMenuItem } from "@/lib/serializers";
import { deleteFromCloudinary } from "@/lib/cloudinary";

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

    // Fetch existing menu item to check for image changes
    const existingItem = await MenuItem.findOne({ _id: id, vendorId });
    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Clean up old Cloudinary image if it was replaced or removed
    if (body.image !== undefined) {
      const oldPublicId = existingItem.image?.publicId;
      const newPublicId = body.image?.publicId;
      if (oldPublicId && oldPublicId !== newPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

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

    // Fetch the menu item first to clean up its Cloudinary asset
    const existingItem = await MenuItem.findOne({ _id: id, vendorId });
    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Clean up Cloudinary image
    if (existingItem.image?.publicId) {
      await deleteFromCloudinary(existingItem.image.publicId);
    }

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
