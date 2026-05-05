import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Vendor from "@/models/Vendor";

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;
    const skip = (page - 1) * limit;

    let query: any = { isAvailable: true };
    if (category && category !== "all") {
      query.category = category;
    }
    if (q) {
      query = {
        ...query,
        $or: [
          { name: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } }
        ]
      };
    }
    
    // Fetch all menu items and vendors
    const items = await MenuItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const vendors = await Vendor.find({});
    
    const vendorMap = new Map();
    vendors.forEach(v => vendorMap.set(v._id.toString(), v.name));
    
    // Attach fabricated vendorName for UI
    const mappedItems = items.map(item => {
      const doc = item.toJSON();
      doc.vendorName = vendorMap.get(doc.vendorId) || "Campus Vendor";
      doc.tag = doc.price > 1000 ? "🔥 Hot" : null; // Fabricate tag
      return doc;
    });
    
    return NextResponse.json(mappedItems);
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus" },
      { status: 500 }
    );
  }
}
