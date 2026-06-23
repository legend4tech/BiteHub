import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import PlatformFeedback from "@/models/PlatformFeedback"
import VendorFeedback from "@/models/VendorFeedback"
import Vendor from "@/models/Vendor"
import Order from "@/models/Order"
import { strictRateLimiter, isRateLimitingEnabled } from "@/lib/rate-limit"
import { z } from "zod"

const feedbackSchema = z
  .object({
    orderId: z.string().optional(),
    vendorId: z.string().optional(), // For vendor giving platform feedback
    platform: z
      .object({
        rating: z.number().min(1).max(5),
        comments: z
          .string()
          .min(3, "Comments must be at least 3 characters long"),
      })
      .optional(),
    vendor: z
      .object({
        vendorId: z.string().min(1, "Vendor ID is required"),
        rating: z.number().min(1).max(5),
        comments: z
          .string()
          .min(3, "Comments must be at least 3 characters long"),
        isAnonymous: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((data) => data.platform || data.vendor, {
    message: "At least one feedback (platform or vendor) must be provided",
    path: ["platform", "vendor"],
  })

export async function POST(request: Request) {
  try {
    await dbConnect()

    // Rate limiting
    if (isRateLimitingEnabled) {
      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1"
      const { success } = await strictRateLimiter.limit(`feedback_${ip}`)
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    const body = await request.json()
    const parsedBody = feedbackSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const { orderId, vendorId, platform, vendor } = parsedBody.data

    // Check if feedback already exists for this orderId to prevent duplicates
    if (orderId) {
      const existingVendorFeedback = await VendorFeedback.findOne({ orderId })
      const existingPlatformFeedback = await PlatformFeedback.findOne({
        orderId,
      })

      if (existingVendorFeedback || existingPlatformFeedback) {
        return NextResponse.json(
          { error: "Feedback has already been submitted for this order." },
          { status: 400 }
        )
      }
    }

    // Save Platform Feedback if provided
    if (platform) {
      await PlatformFeedback.create({
        orderId,
        vendorId, // Will be present if a vendor is giving feedback
        rating: platform.rating,
        comments: platform.comments,
      })
    }

    // Save Vendor Feedback if provided
    if (vendor) {
      await VendorFeedback.create({
        orderId,
        vendorId: vendor.vendorId,
        rating: vendor.rating,
        comments: vendor.comments,
        isAnonymous: vendor.isAnonymous,
      })

      // Update Vendor aggregate rating atomically
      const vendorDoc = await Vendor.findById(vendor.vendorId)
      if (vendorDoc) {
        const currentRating = vendorDoc.rating || 0
        const currentCount = vendorDoc.ratingCount || 0

        const newCount = currentCount + 1
        const newRating =
          (currentRating * currentCount + vendor.rating) / newCount

        vendorDoc.rating = newRating
        vendorDoc.ratingCount = newCount
        await vendorDoc.save()
      }
    }

    // Mark order as rated if applicable
    if (orderId) {
      await Order.findOneAndUpdate({ orderId }, { $set: { isRated: true } })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/feedback] Error saving feedback:", error)
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    )
  }
}
