import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import VendorModel from "@/models/Vendor"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    await dbConnect()
    const { vendorId } = await params

    if (!vendorId || vendorId.length !== 24) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    const vendor = await VendorModel.findById(vendorId)
      .select("deliveryFee prepTime paystackSubaccountCode")
      .lean()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json({
      deliveryFee: vendor.deliveryFee ?? 0,
      prepTime: vendor.prepTime ?? "",
      paystackSubaccountCode: vendor.paystackSubaccountCode ?? "",
    })
  } catch (error) {
    console.error("[GET /api/vendors/fee/[vendorId]]", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor fee" },
      { status: 500 }
    )
  }
}
