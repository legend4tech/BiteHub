import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import VendorUser from "@/models/VendorUser"
import { auth } from "@/auth"
import GlobalSettings from "@/models/GlobalSettings"
import axios from "axios"
import { sendBankSetupConfirmationEmail } from "@/lib/mail"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const BANK_UPDATE_LOCK_DAYS = Number(process.env.BANK_UPDATE_LOCK_DAYS || 14)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    await dbConnect()
    const settings = await GlobalSettings.findOne()
    const PLATFORM_FEE_PERCENTAGE = settings
      ? settings.platformFeePercentage
      : Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || 5)

    const session = await auth()
    if (
      !session ||
      session.user?.role !== "vendor" ||
      (session.user as { vendorId?: string })?.vendorId !== slug
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const vendorId = new Types.ObjectId(slug)
    const { accountNumber, bankCode, bankName } = await request.json()

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "Account number and bank code are required" },
        { status: 400 }
      )
    }

    const vendor = await Vendor.findById(vendorId)
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    if (vendor.paystackSubaccountCode) {
      return NextResponse.json(
        { error: "Subaccount already exists. Use the update flow." },
        { status: 400 }
      )
    }

    // Call Paystack to create subaccount using axios
    const paystackRes = await axios.post(
      "https://api.paystack.co/subaccount",
      {
        business_name: vendor.name,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: PLATFORM_FEE_PERCENTAGE,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    const paystackData = paystackRes.data

    if (!paystackData.status) {
      return NextResponse.json(
        {
          error: paystackData.message || "Failed to create Paystack subaccount",
        },
        { status: 400 }
      )
    }

    const subaccountCode = paystackData.data.subaccount_code

    // Update vendor model
    vendor.paystackSubaccountCode = subaccountCode
    vendor.paystackBankCode = bankCode
    vendor.paystackIntegrationStatus = "active"
    vendor.lastBankUpdateAt = new Date()
    await vendor.save()

    // Send confirmation email
    const vendorUser = await VendorUser.findOne({ vendorId })
    if (vendorUser && vendorUser.email) {
      await sendBankSetupConfirmationEmail(
        vendorUser.email,
        vendor.name,
        bankName || "Your Bank",
        accountNumber,
        BANK_UPDATE_LOCK_DAYS
      )
    }

    return NextResponse.json({
      success: true,
      subaccountCode,
      message: "Paystack integration successful",
    })
  } catch (error) {
    console.error("[vendors/[slug]/paystack POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
