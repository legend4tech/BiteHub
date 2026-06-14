import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import VendorUserModel from "@/models/VendorUser"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { DEFAULT_SCHOOL_ID, DEFAULT_CAMPUS_ID } from "@/lib/config/campus"
import { strongPasswordSchema, formatToWhatsapp } from "@/lib/schemas"

// GET — all vendors for admin (no isActive filter)
export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const vendors = await VendorModel.find({}).sort({ createdAt: -1 }).lean()

    // Fetch corresponding VendorUser accounts
    const vendorIds = vendors.map((v) => v._id)
    const users = await VendorUserModel.find({ vendorId: { $in: vendorIds } })
      .select("vendorId email isActive lastLoginAt createdAt")
      .lean()

    const userMap = new Map(users.map((u) => [u.vendorId.toString(), u]))

    const result = vendors.map((v) => {
      const id = String(v._id)
      const user = userMap.get(id)
      return {
        id,
        name: v.name,
        slug: v.slug,
        description: v.description,
        category: v.category,
        tags: v.tags,
        whatsappNumber: v.whatsappNumber,
        campus: v.campus,
        school: v.school,
        isActive: v.isActive,
        image: v.image,
        createdAt: (v as { createdAt: string }).createdAt,
        // Login account info (may be null if not yet created)
        account: user
          ? {
              email: user.email,
              isActive: user.isActive,
              lastLoginAt: user.lastLoginAt ?? null,
              createdAt: (user as { createdAt: string }).createdAt,
            }
          : null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[admin/vendors GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    )
  }
}

// POST — create vendor profile + login account atomically
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()

    const {
      name,
      whatsappNumber,
      campus,
      school,
      description,
      category,
      tags,
      prepTime,
      email,
      password,
      image,
    } = body

    if (!name || !whatsappNumber || !email || !password) {
      return NextResponse.json(
        { error: "name, whatsappNumber, email and password are required" },
        { status: 400 }
      )
    }

    const pwCheck = strongPasswordSchema.safeParse(password)
    if (!pwCheck.success) {
      return NextResponse.json(
        { error: pwCheck.error.issues[0].message },
        { status: 400 }
      )
    }

    // Uniqueness checks
    const existingEmail = await VendorUserModel.findOne({
      email: email.toLowerCase().trim(),
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    const existingSlug = await VendorModel.findOne({ slug })
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

    // Create vendor profile
    const vendor = await VendorModel.create({
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() || "",
      category: category?.trim() || "general",
      tags: Array.isArray(tags) ? tags : [],
      whatsappNumber: formatToWhatsapp(whatsappNumber.trim()),
      campus: campus?.trim() || DEFAULT_CAMPUS_ID,
      school: school?.trim() || DEFAULT_SCHOOL_ID,
      prepTime: prepTime?.trim() || "",
      image: image,
      isActive: true,
    })

    // Hash password and create login account
    const passwordHash = await bcrypt.hash(password, 12)
    await VendorUserModel.create({
      vendorId: vendor._id,
      email: email.toLowerCase().trim(),
      password: passwordHash,
      role: "vendor",
      isActive: true,
    })

    return NextResponse.json(
      {
        message: "Vendor created successfully",
        vendorId: vendor._id.toString(),
        slug: finalSlug,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[admin/vendors POST]", error)
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    )
  }
}
