import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import VendorUser from "@/models/VendorUser"
import { auth } from "@/auth"
import { sendBankChangeConfirmationEmail } from "@/lib/mail"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
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
    const { accountNumber, bankCode, bankName, otp } = await request.json()

    if (!accountNumber || !bankCode || !otp) {
      return NextResponse.json(
        { error: "Account number, bank code, and OTP are required" },
        { status: 400 }
      )
    }

    const vendor = await Vendor.findById(vendorId)
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    if (!vendor.paystackSubaccountCode) {
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

    // Call Paystack to UPDATE subaccount
    // Paystack PUT /subaccount/:id_or_code
    const paystackRes = await fetch(
      `https://api.paystack.co/subaccount/${vendor.paystackSubaccountCode}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settlement_bank: bankCode,
          account_number: accountNumber,
        }),
      }
    )

    const paystackData = await paystackRes.json()

    if (!paystackData.status) {
      return NextResponse.json(
        {
          error: paystackData.message || "Failed to update Paystack subaccount",
        },
        { status: 400 }
      )
    }

    // Update vendor model
    vendor.paystackBankCode = bankCode
    vendor.lastBankUpdateAt = new Date()
    // Clear OTP fields
    vendor.bankUpdateOtp = undefined
    vendor.bankUpdateOtpExpiry = undefined
    vendor.bankUpdateOtpAttempts = 0
    await vendor.save()

    // Send Confirmation Email
    const lockDays = Number(process.env.BANK_UPDATE_LOCK_DAYS || 14)
    const vendorUser = await VendorUser.findOne({ vendorId })
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
    console.error("[vendors/[slug]/paystack/verify-change POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
