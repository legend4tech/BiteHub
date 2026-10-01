import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import CustomerModel from "@/models/Customer"
import { auth } from "@/auth"

// PATCH — toggle customer isActive
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const { isActive } = await request.json()

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      )
    }

    const { id } = await params
    const customer = await CustomerModel.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: "after" }
    )

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: `Customer account ${isActive ? "activated" : "suspended"} successfully.`,
      isActive: customer.isActive,
    })
  } catch (error) {
    console.error("[admin/customers/[id] PATCH]", error)
    return NextResponse.json(
      { error: "Failed to update customer status" },
      { status: 500 }
    )
  }
}
