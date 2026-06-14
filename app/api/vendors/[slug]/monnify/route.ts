import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import VendorUser from "@/models/VendorUser"
import { auth } from "@/auth"
import GlobalSettings from "@/models/GlobalSettings"
import { createMonnifySubaccount, getSubaccounts } from "@/lib/monnify"
import { sendBankSetupConfirmationEmail } from "@/lib/mail"

const BANK_UPDATE_LOCK_DAYS = Number(process.env.BANK_UPDATE_LOCK_DAYS || 14)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    await dbConnect()

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

    if (vendor.monnifySubAccountCode) {
      return NextResponse.json(
        { error: "Subaccount already exists. Use the update flow." },
        { status: 400 }
      )
    }

    const vendorUser = await VendorUser.findOne({ vendorId })
    if (!vendorUser || !vendorUser.email) {
      return NextResponse.json(
        { error: "Vendor email not found" },
        { status: 400 }
      )
    }

    let subaccountCode = ""
    try {
      // Calculate the exact split percentage for the vendor
      const settings = await GlobalSettings.findOne()
      const platformFee = settings ? settings.platformFeePercentage : 5
      const vendorSplitPercentage = 100 - platformFee

      const subaccount = await createMonnifySubaccount(
        bankCode,
        accountNumber,
        vendorUser.email,
        vendorSplitPercentage
      )
      subaccountCode = subaccount.subAccountCode
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes("already exists") ||
          error.message.toLowerCase().includes("could not find bvn"))
      ) {
        // Fallback: If it already exists or Monnify threw the non-atomic BVN error but created it, fetch it!
        const existingSubaccounts = await getSubaccounts()
        const match = existingSubaccounts.find(
          (s: { accountNumber: string; subAccountCode: string }) =>
            s.accountNumber === accountNumber
        )
        if (match) {
          subaccountCode = match.subAccountCode
        } else {
          throw new Error(
            "Subaccount already exists, but could not be retrieved from Monnify."
          )
        }
      } else {
        throw error
      }
    }

    // Update vendor model
    vendor.monnifySubAccountCode = subaccountCode
    vendor.monnifyBankCode = bankCode
    vendor.monnifyAccountNumber = accountNumber
    vendor.monnifyIntegrationStatus = "active"
    vendor.lastBankUpdateAt = new Date()
    await vendor.save()

    // Send confirmation email
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
      message: "Monnify integration successful",
    })
  } catch (error: unknown) {
    console.error("[vendors/[slug]/monnify POST]", error)
    const errMsg =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
