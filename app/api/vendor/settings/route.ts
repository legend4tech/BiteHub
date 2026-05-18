import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import Vendor from "@/models/Vendor";
import { auth } from "@/auth";
import { serializeVendor } from "@/lib/serializers";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "vendor" || !(session.user as any)?.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const vendorId = new Types.ObjectId((session.user as any).vendorId);
    const body = await request.json();

    const { name, description, category, tags, whatsappNumber, image } = body;

    // Fetch existing vendor to check for image changes
    const existingVendor = await Vendor.findById(vendorId);
    if (!existingVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Clean up old Cloudinary image if it was replaced or removed
    if (image !== undefined) {
      const oldPublicId = existingVendor.image?.publicId;
      const newPublicId = image?.publicId;
      if (oldPublicId && oldPublicId !== newPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

    // Build update object
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name?.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (category !== undefined) updateData.category = category?.trim();
    if (tags !== undefined) updateData.tags = tags;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber?.trim();
    if (image !== undefined) updateData.image = image;

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updatedVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(serializeVendor(updatedVendor));
  } catch (error) {
    console.error("[vendor/settings PATCH]", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
