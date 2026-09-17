import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import VendorUser from "@/models/VendorUser"
import { auth } from "@/auth"
import { sendBankChangeConfirmationEmail } from "@/lib/mail"
import { updateMonnifySubaccount, getSubaccounts } from "@/lib/monnify"
import GlobalSettings from "@/models/GlobalSettings"
import { monnifyBankVerifySchema } from "@/lib/schemas"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await request.json()
    const parsedBody = monnifyBankVerifySchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }
    const { accountNumber, bankCode, bankName, otp } = parsedBody.data

    const { slug } = await params
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

    const vendor = await Vendor.findById(vendorId)
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Prevent multiple vendors from linking the exact same bank account
    // EXCEPT if the vendor is flagged as Managed Vendor by BiteHub
    if (!vendor.isManagedByBiteHub) {
      const existingBankUser = await Vendor.findOne({
        monnifyAccountNumber: accountNumber,
        _id: { $ne: vendorId },
      })

      if (existingBankUser) {
        return NextResponse.json(
          {
            error: "This bank account is already registered to another vendor.",
          },
          { status: 400 }
        )
      }
    }

    if (!vendor.monnifySubAccountCode) {
      return NextResponse.json(
        { error: "No subaccount exists. Use the setup flow." },
        { status: 400 }
      )
    }

    // Check if OTP verification is locked due to too many failed attempts
    if (vendor.bankUpdateOtpAttempts && vendor.bankUpdateOtpAttempts >= 5) {
      return NextResponse.json(
        { error: "Too many failed OTP attempts. Please request a new OTP." },
        { status: 429 }
      )
    }

    if (
      !vendor.bankUpdateOtpExpiry ||
      new Date() > vendor.bankUpdateOtpExpiry
    ) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
    }

    // Verify OTP
    if (!vendor.bankUpdateOtp || vendor.bankUpdateOtp !== otp) {
      vendor.bankUpdateOtpAttempts = (vendor.bankUpdateOtpAttempts || 0) + 1
      await vendor.save()
      const remainingAttempts = 5 - vendor.bankUpdateOtpAttempts
      return NextResponse.json(
        { error: `Invalid OTP. ${remainingAttempts} attempts remaining.` },
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

    let subaccountCode = vendor.monnifySubAccountCode
    try {
      const settings = await GlobalSettings.findOne()
      const platformFee = settings ? settings.platformFeePercentage : 5
      const vendorSplitPercentage = 100 - platformFee

      const subaccount = await updateMonnifySubaccount(
        vendor.monnifySubAccountCode,
        bankCode,
        accountNumber,
        vendorUser.email,
        vendorSplitPercentage
      )
      if (subaccount?.subAccountCode) subaccountCode = subaccount.subAccountCode
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes("already exists") ||
          error.message.toLowerCase().includes("could not find bvn"))
      ) {
        // Fallback: If it already exists or Monnify threw the non-atomic BVN error but updated/created it, fetch it!
        const existingSubaccounts = await getSubaccounts()
        const match = existingSubaccounts.find(
          (s: { accountNumber: string; subAccountCode: string }) =>
            s.accountNumber === accountNumber
        )
        if (match) {
          subaccountCode = match.subAccountCode
        } else {
          throw new Error("Failed to verify subaccount update with Monnify.")
        }
      } else {
        throw error
      }
    }

    // Update vendor model
    vendor.monnifySubAccountCode = subaccountCode
    vendor.monnifyBankCode = bankCode
    vendor.lastBankUpdateAt = new Date()
    // Clear OTP fields
    vendor.bankUpdateOtp = undefined
    vendor.bankUpdateOtpExpiry = undefined
    vendor.bankUpdateOtpAttempts = 0
    await vendor.save()

    // Send Confirmation Email
    const lockDays = Number(process.env.BANK_UPDATE_LOCK_DAYS || 14)
    if (vendorUser && vendorUser.email) {
      await sendBankChangeConfirmationEmail(
        vendorUser.email,
        vendor.name,
        bankName || "Your Bank",
        accountNumber,
        lockDays
      )
    }

    return NextResponse.json({
      success: true,
      message: "Bank details updated successfully",
    })
  } catch (error) {
    console.error("[vendors/[slug]/monnify/verify-change POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
