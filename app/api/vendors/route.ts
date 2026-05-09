import { NextResponse } from "next/server";
import { QueryFilter } from "mongoose";
import dbConnect from "@/lib/db";
import VendorModel, { IVendor } from "@/models/Vendor";
import { serializeVendor } from "@/lib/serializers";
import MenuItem from "@/models/MenuItem";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;
    const skip = (page - 1) * limit;

    // Properly typed query instead of `any`
    let query: QueryFilter<IVendor> = { isActive: true };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    // .select() replaces manual field picking — if you add a field to the
    // Vendor model tomorrow, it's automatically included without touching
    // this route. .lean() returns plain JS objects instead of heavy Mongoose
    // documents, which is faster when you only need to serialize to JSON.
    // NOTE: Virtual fields (initials, tagline, location) are NOT included
    // in .lean() output — they are computed manually in the map below.
    const vendors = await VendorModel.find(query)
      .select(
        "name isActive slug description category tags phone whatsappNumber school campus createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const vendorIds = vendors.map((v) => v._id as mongoose.Types.ObjectId);

    // Single aggregation query to count available menu items per vendor.
    const counts = await MenuItem.aggregate([
      {
        $match: {
          vendorId: { $in: vendorIds },
          isAvailable: true,
        },
      },
      {
        $group: {
          _id: "$vendorId",
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a Map for O(1) lookup per vendor instead of nested loops
    const countMap = new Map<string, number>(
      counts.map((c) => [c._id.toString(), c.count])
    );

    // Serialize all vendors safely and attach computed item counts
    const serializedVendors = vendors.map((vendor) => ({
      ...serializeVendor(vendor),
      itemCount: countMap.get(vendor._id.toString()) || 0,
    }));

    return NextResponse.json(serializedVendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}