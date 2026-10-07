import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import MenuItem from "@/models/MenuItem"
import { auth } from "@/auth"
import { serializeMenuItem } from "@/lib/serializers"
import { deleteFromCloudinary } from "@/lib/cloudinary"
import { isItemAvailableNow } from "@/lib/timeUtils"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants"
import type { SanitizedMenuItemUpdate } from "@/lib/schemas"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const item = await MenuItem.findOne({ _id: id, vendorId }).lean()

    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeMenuItem(item))
  } catch (error) {
    console.error("[vendor/menu GET single]", error)
    return NextResponse.json(
      { error: "Failed to fetch menu item" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { menuItemFormSchema } = await import("@/lib/schemas")
    const parsedBody = menuItemFormSchema.partial().safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const safeData = parsedBody.data
    const sanitizedBody = { ...safeData } as unknown as SanitizedMenuItemUpdate

    // Cast and sanitize fields according to the schema
    if (safeData.priceInKobo !== undefined) {
      sanitizedBody.priceInKobo = Number(safeData.priceInKobo)
    }
    if (safeData.quantityAvailable !== undefined) {
      sanitizedBody.quantityAvailable =
        safeData.quantityAvailable !== null && safeData.quantityAvailable !== ""
          ? Number(safeData.quantityAvailable)
          : null
    }
    if (safeData.prepTimeValue !== undefined) {
      sanitizedBody.prepTimeValue = safeData.prepTimeValue
        ? Number(safeData.prepTimeValue)
        : null
    }

    // Explicitly restrict updates to validated fields only to prevent ownership/id injection
    delete sanitizedBody.vendorId // Hard guard

    // Fetch existing menu item to check for image changes
    const existingItem = await MenuItem.findOne({ _id: id, vendorId })
    if (!existingItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }

    // Clean up old Cloudinary image if it was replaced or removed
    if (sanitizedBody.image !== undefined) {
      const oldPublicId = existingItem.image?.publicId
      const newPublicId = sanitizedBody.image?.publicId
      if (oldPublicId && oldPublicId !== newPublicId) {
        await deleteFromCloudinary(oldPublicId)
      }
    }

    // Prepare updated fields for availability calculation
    const updatedIsAvailable =
      sanitizedBody.isAvailable ?? existingItem.isAvailable
    const updatedAvailableFrom =
      sanitizedBody.availableFrom ?? existingItem.availableFrom
    const updatedAvailableTo =
      sanitizedBody.availableTo ?? existingItem.availableTo
    const updatedAvailableDays =
      sanitizedBody.availableDays ?? existingItem.availableDays

    const updatedQuantityAvailable =
      sanitizedBody.quantityAvailable !== undefined
        ? sanitizedBody.quantityAvailable
        : existingItem.quantityAvailable

    const updatedIsPreorder =
      sanitizedBody.isPreorder ?? existingItem.isPreorder
    const updatedPreorderEndDate =
      sanitizedBody.preorderEndDate !== undefined
        ? sanitizedBody.preorderEndDate
        : existingItem.preorderEndDate

    sanitizedBody.computedIsAvailableNow = isItemAvailableNow(
      updatedIsAvailable,
      updatedAvailableFrom,
      updatedAvailableTo,
      updatedAvailableDays,
      updatedQuantityAvailable,
      updatedIsPreorder,
      updatedPreorderEndDate
    )

    // Reset low stock alert if the vendor restocks the item above the threshold or sets it to infinite
    if (
      sanitizedBody.quantityAvailable === null ||
      (sanitizedBody.quantityAvailable !== undefined &&
        sanitizedBody.quantityAvailable > LOW_STOCK_THRESHOLD)
    ) {
      sanitizedBody.lowStockAlertSent = false
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, vendorId },
      { $set: sanitizedBody },
      { returnDocument: "after" }
    ).lean()

    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeMenuItem(item))
  } catch (error) {
    console.error("[vendor/menu PATCH]", error)
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Fetch the menu item first to clean up its Cloudinary asset
    const existingItem = await MenuItem.findOne({ _id: id, vendorId })
    if (!existingItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }

    // Clean up Cloudinary image
    if (existingItem.image?.publicId) {
      await deleteFromCloudinary(existingItem.image.publicId)
    }

    const item = await MenuItem.findOneAndDelete({ _id: id, vendorId })

    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[vendor/menu DELETE]", error)
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    )
  }
}
