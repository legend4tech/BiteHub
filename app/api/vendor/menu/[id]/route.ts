import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import MenuItem from "@/models/MenuItem"
import { auth } from "@/auth"
import { serializeMenuItem } from "@/lib/serializers"
import { deleteFromCloudinary } from "@/lib/cloudinary"
import { isItemAvailableNow } from "@/lib/timeUtils"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants"

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

    // Fetch existing menu item to check for image changes
    const existingItem = await MenuItem.findOne({ _id: id, vendorId })
    if (!existingItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      )
    }

    // Clean up old Cloudinary image if it was replaced or removed
    if (body.image !== undefined) {
      const oldPublicId = existingItem.image?.publicId
      const newPublicId = body.image?.publicId
      if (oldPublicId && oldPublicId !== newPublicId) {
        await deleteFromCloudinary(oldPublicId)
      }
    }

    // Prepare updated fields for availability calculation
    const updatedIsAvailable = body.isAvailable ?? existingItem.isAvailable
    const updatedAvailableFrom =
      body.availableFrom ?? existingItem.availableFrom
    const updatedAvailableTo = body.availableTo ?? existingItem.availableTo
    const updatedAvailableDays =
      body.availableDays ?? existingItem.availableDays

    const updatedQuantityAvailable =
      body.quantityAvailable !== undefined
        ? body.quantityAvailable
        : existingItem.quantityAvailable

    const updatedIsPreorder = body.isPreorder ?? existingItem.isPreorder
    const updatedPreorderEndDate =
      body.preorderEndDate !== undefined
        ? body.preorderEndDate
        : existingItem.preorderEndDate

    body.computedIsAvailableNow = isItemAvailableNow(
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
      body.quantityAvailable === null ||
      (body.quantityAvailable !== undefined &&
        body.quantityAvailable > LOW_STOCK_THRESHOLD)
    ) {
      body.lowStockAlertSent = false
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, vendorId },
      { $set: body },
      { new: true }
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
