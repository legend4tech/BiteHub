import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { uploadStream, deleteFromCloudinary } from "@/lib/cloudinary"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(
        `upload_post_${session.user.id}`
      )
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    const formData = await request.formData()
    const file = formData.get("file") as unknown as File
    const type = formData.get("type") as string // 'vendor' or 'menu'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!type || !["vendor", "menu", "customer"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid upload type" },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine folder
    const folder =
      type === "vendor"
        ? "bitehub/vendorsimg"
        : type === "menu"
          ? "bitehub/menuimg"
          : "bitehub/customerimg"

    // Upload to Cloudinary
    const result = await uploadStream(buffer, folder)

    return NextResponse.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error("[POST /api/upload] Error:", error)
    return NextResponse.json(
      { error: "Upload failed", details: err.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(
        `upload_del_${session.user.id}`
      )
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    const { publicId } = await request.json()
    if (!publicId) {
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 })
    }

    await deleteFromCloudinary(publicId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error("[DELETE /api/upload] Error:", error)
    return NextResponse.json(
      { error: "Deletion failed", details: err.message },
      { status: 500 }
    )
  }
}
