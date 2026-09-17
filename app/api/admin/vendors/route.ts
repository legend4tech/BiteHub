import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"
import VendorUserModel from "@/models/VendorUser"
import AdminUserModel from "@/models/AdminUser"
import MenuItemModel from "@/models/MenuItem"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { DEFAULT_SCHOOL_ID, DEFAULT_CAMPUS_ID } from "@/lib/config/campus"
import { strongPasswordSchema, formatToWhatsapp } from "@/lib/schemas"
import { adminCreateVendorApiSchema } from "@/lib/schemas/admin"

// GET — all vendors for admin (no isActive filter)
export async function GET() {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin", "vendor_manager"].includes(
        session.user?.role || ""
      )
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

    // Fetch AdminUsers for onboardedBy tracking
    const adminUserIds = vendors
      .map((v) => v.onboardedBy)
      .filter((id) => id != null)
    const adminUsers = await AdminUserModel.find({ _id: { $in: adminUserIds } })
      .select("_id name")
      .lean()
    const adminMap = new Map(adminUsers.map((a) => [a._id.toString(), a.name]))

    // Fetch MenuItem counts per vendor
    const menuCounts = await MenuItemModel.aggregate([
      { $match: { vendorId: { $in: vendorIds } } },
      { $group: { _id: "$vendorId", count: { $sum: 1 } } },
    ])
    const menuMap = new Map(menuCounts.map((m) => [m._id.toString(), m.count]))

    const result = vendors.map((v) => {
      const id = String(v._id)
      const user = userMap.get(id)
      const onboardedByName = v.onboardedBy
        ? adminMap.get(v.onboardedBy.toString())
        : undefined
      const hasMenu = (menuMap.get(id) || 0) > 0

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
        isFeatured: v.isFeatured || false,
        hasMenu,
        image: v.image,
        isManagedByBiteHub: v.isManagedByBiteHub || false,
        pendingWalletBalance: v.pendingWalletBalance || 0,
        monnifyBankCode: v.monnifyBankCode,
        monnifyAccountNumber: v.monnifyAccountNumber,
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
        onboardedByName,
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
      !["admin", "superadmin", "vendor_manager"].includes(
        session.user?.role || ""
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()

    const parsedBody = adminCreateVendorApiSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0].message },
        { status: 400 }
      )
    }

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
      isManagedByBiteHub,
    } = parsedBody.data

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
      onboardedBy: session.user.id,
      isManagedByBiteHub: isManagedByBiteHub || false,
    })

    // Hash password and create login account
    const passwordHash = await bcrypt.hash(password, 12)
    const vendorEmail = email.toLowerCase().trim()
    await VendorUserModel.create({
      vendorId: vendor._id,
      email: vendorEmail,
      password: passwordHash,
      role: "vendor",
      isActive: true,
    })

    // Send welcome email in the background
    const { sendVendorWelcomeEmail } = await import("@/lib/mail")
    void sendVendorWelcomeEmail(vendorEmail, vendor.name, password)

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
