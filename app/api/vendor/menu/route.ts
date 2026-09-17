import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import MenuItem from "@/models/MenuItem"
import { syncVendorMenuScores } from "@/lib/services/scoreService"
import { auth } from "@/auth"
import { serializeMenuItem } from "@/lib/serializers"
import { isItemAvailableNow } from "@/lib/timeUtils"
import { menuItemFormSchema } from "@/lib/schemas"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      session.user?.role !== "vendor" ||
      !session.user?.vendorId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendorId = new Types.ObjectId(session.user.vendorId)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const search = searchParams.get("search")?.trim() || ""
    const category = searchParams.get("category")?.trim() || ""
    const skip = (page - 1) * limit

    // Build filter — always scope to the authenticated vendor
    const filter: Record<string, unknown> = { vendorId }
    if (search) filter.name = { $regex: search, $options: "i" }
    if (category) filter.category = { $regex: category, $options: "i" }

    const items = await MenuItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    return NextResponse.json(items.map(serializeMenuItem))
  } catch (error) {
    console.error("[vendor/menu GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      session.user?.role !== "vendor" ||
      !session.user?.vendorId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendorId = new Types.ObjectId(session.user.vendorId)
    const body = await request.json()

    const parsedBody = menuItemFormSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const {
      name,
      description,
      price,
      category,
      image,
      isAvailable,
      availableFrom,
      availableTo,
      prepTimeValue,
      prepTimeUnit,
      quantityAvailable,
      availableDays,
      isPreorder,
      preorderEndDate,
      preorderDeliveryInfo,
    } = parsedBody.data

    const newItem = await MenuItem.create({
      vendorId,
      name: name.trim(),
      description: description?.trim(),
      price: Number(price),
      category: category.trim(),
      image,
      isAvailable: isAvailable ?? true,
      availableFrom,
      availableTo,
      prepTimeValue: prepTimeValue ? Number(prepTimeValue) : null,
      prepTimeUnit: prepTimeUnit || null,
      quantityAvailable:
        quantityAvailable !== undefined &&
        quantityAvailable !== null &&
        quantityAvailable !== ""
          ? Number(quantityAvailable)
          : null,
      availableDays: availableDays || [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      isPreorder,
      preorderEndDate,
      preorderDeliveryInfo,
    })

    const computedIsAvailableNow = isItemAvailableNow(
      newItem.isAvailable,
      newItem.availableFrom,
      newItem.availableTo,
      newItem.availableDays,
      newItem.quantityAvailable,
      newItem.isPreorder,
      newItem.preorderEndDate
    )
    newItem.computedIsAvailableNow = computedIsAvailableNow
    await newItem.save()

    await syncVendorMenuScores(vendorId)

    return NextResponse.json(serializeMenuItem(newItem.toObject()), {
      status: 201,
    })
  } catch (error) {
    console.error("[vendor/menu POST]", error)
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    )
  }
}
