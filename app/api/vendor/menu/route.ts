import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import { auth } from "@/auth";
import { serializeMenuItem } from "@/lib/serializers";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "vendor" || !(session.user as any)?.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const vendorId = new Types.ObjectId((session.user as any).vendorId);

    const { searchParams } = new URL(request.url);
    const page     = parseInt(searchParams.get("page")     || "1",  10);
    const limit    = parseInt(searchParams.get("limit")    || "10", 10);
    const search   = searchParams.get("search")?.trim()   || "";
    const category = searchParams.get("category")?.trim() || "";
    const skip = (page - 1) * limit;

    // Build filter — always scope to the authenticated vendor
    const filter: Record<string, any> = { vendorId };
    if (search)   filter.name     = { $regex: search,   $options: "i" };
    if (category) filter.category = { $regex: category, $options: "i" };

    const items = await MenuItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(items.map(serializeMenuItem));
  } catch (error) {
    console.error("[vendor/menu GET]", error);
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "vendor" || !(session.user as any)?.vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const vendorId = new Types.ObjectId((session.user as any).vendorId);
    const body = await request.json();

    const { name, description, price, category, image, isAvailable, availableFrom, availableTo } = body;

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 });
    }

    const imageObj = image || {
      url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
      publicId: "default_menu_image",
    };

    const newItem = await MenuItem.create({
      vendorId,
      name: name.trim(),
      description: description?.trim(),
      price: Number(price),
      category: category.trim(),
      image: imageObj,
      isAvailable: isAvailable ?? true,
      availableFrom,
      availableTo,
    });

    return NextResponse.json(serializeMenuItem(newItem.toObject()), { status: 201 });
  } catch (error) {
    console.error("[vendor/menu POST]", error);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
