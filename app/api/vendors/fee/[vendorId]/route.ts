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
      .select("defaultDeliveryFeeInKobo prepTime monnifySubAccountCode")
      .lean()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json({
      defaultDeliveryFeeInKobo: vendor.defaultDeliveryFeeInKobo ?? 0,
      prepTime: vendor.prepTime ?? "",
      monnifySubaccountCode: vendor.monnifySubAccountCode ?? "",
    })
  } catch (error) {
    console.error("[GET /api/vendors/fee/[vendorId]]", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor fee" },
      { status: 500 }
    )
  }
}
