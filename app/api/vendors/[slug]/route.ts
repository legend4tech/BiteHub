import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import VendorModel from "@/models/Vendor";
import MenuItemModel from "@/models/MenuItem";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    const vendor = await VendorModel.findOne({ slug }).lean();

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    const menuItems = await MenuItemModel.find({ vendorId: vendor._id }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      vendor,
      menuItems
    });
  } catch (error) {
    console.error("Error fetching vendor by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}
