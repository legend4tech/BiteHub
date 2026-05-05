import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Vendor from "@/models/Vendor";

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;
    const skip = (page - 1) * limit;

    let query: any = { isActive: true };
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } }
      ];
    }
    
    const vendors = await Vendor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    
    const mappedVendors = vendors.map(v => ({
      id: v.id,
      name: v.name,
      initials: v.initials,
      tagline: v.tagline,
      location: v.location,
      isActive: v.isActive,
      slug: v.slug,
      description: v.description,
      category: v.category,
      tags: v.tags,
      phone: v.phone,
      whatsappNumber: v.whatsappNumber,
      school: v.school,
      campus: v.campus,
    }));
    
    return NextResponse.json(mappedVendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
