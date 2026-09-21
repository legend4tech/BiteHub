import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorFeedback from "@/models/VendorFeedback"
import { auth } from "@/auth"
import { Types } from "mongoose"
import {
  serializeVendorFeedback,
  serializeMenuItemFeedback,
  type LeanVendorFeedback,
  type LeanMenuItemFeedback,
} from "@/lib/serializers"
import MenuItemFeedback from "@/models/MenuItemFeedback"
import { ItemFeedbackUI } from "@/types/vendor"

export async function GET() {
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

    const feedbacks = await VendorFeedback.find({ vendorId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const orderIds = feedbacks.map((f) => f.orderId).filter(Boolean)

    // Fetch all item feedbacks for these orders
    const itemFeedbacks = await MenuItemFeedback.find({
      vendorId,
      orderId: { $in: orderIds },
    })
      .populate("menuItemId", "name")
      .lean()

    // .lean() + .populate() widens the type — we cast to the known lean shape.
    // The populated menuItemId becomes { name: string } at runtime.
    type PopulatedItemFeedback = LeanMenuItemFeedback & {
      menuItemId: { name: string } | LeanMenuItemFeedback["menuItemId"]
    }

    // Group item feedbacks by orderId
    const itemFeedbacksByOrder = itemFeedbacks.reduce(
      (acc: Record<string, ItemFeedbackUI[]>, curr) => {
        const doc = curr as unknown as PopulatedItemFeedback
        if (!doc.orderId) return acc
        if (!acc[doc.orderId]) acc[doc.orderId] = []

        const serializedItem = serializeMenuItemFeedback(doc)
        if (serializedItem) {
          const populatedName =
            doc.menuItemId &&
            typeof doc.menuItemId === "object" &&
            "name" in doc.menuItemId
              ? (doc.menuItemId as { name: string }).name
              : "Unknown Item"
          acc[doc.orderId].push({
            id: serializedItem.id,
            menuItemName: populatedName,
            rating: serializedItem.rating,
            title: serializedItem.title,
            comments: serializedItem.comments ?? undefined,
          })
        }
        return acc
      },
      {}
    )

    // Map feedbacks through the serializer to produce clean frontend JSON
    const sanitizedFeedbacks = feedbacks
      .map((f) => {
        const base = serializeVendorFeedback(f as unknown as LeanVendorFeedback)
        if (!base) return null
        return {
          ...base,
          itemReviews: base.orderId
            ? (itemFeedbacksByOrder[base.orderId] ?? [])
            : [],
        }
      })
      .filter(Boolean)

    return NextResponse.json(sanitizedFeedbacks)
  } catch (error) {
    console.error("[vendor/feedback]", error)
    return NextResponse.json(
      { error: "Failed to load feedback" },
      { status: 500 }
    )
  }
}
