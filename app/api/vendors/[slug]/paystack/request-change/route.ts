import { NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import VendorUser from "@/models/VendorUser"
import { auth } from "@/auth"
import { sendBankChangeOtpEmail } from "@/lib/mail"
import crypto from "crypto"

const BANK_UPDATE_LOCK_DAYS = Number(process.env.BANK_UPDATE_LOCK_DAYS || 14)

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

    // Check time lock
    if (vendor.lastBankUpdateAt) {
      const lockExpiry = new Date(
        vendor.lastBankUpdateAt.getTime() +
          BANK_UPDATE_LOCK_DAYS * 24 * 60 * 60 * 1000
      )
      if (new Date() < lockExpiry) {
        const daysLeft = Math.ceil(
          (lockExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        return NextResponse.json(
          { error: `Account details are locked for ${daysLeft} more days.` },
          { status: 403 }
        )
      }
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()

    // Set expiry to 15 minutes from now
    const expiry = new Date(Date.now() + 15 * 60 * 1000)

    vendor.bankUpdateOtp = otp
    vendor.bankUpdateOtpExpiry = expiry
    vendor.bankUpdateOtpAttempts = 0
    await vendor.save()

    // Send email
    const vendorUser = await VendorUser.findOne({ vendorId })
    if (vendorUser && vendorUser.email) {
      await sendBankChangeOtpEmail(vendorUser.email, vendor.name, otp, 15)
    } else {
      return NextResponse.json(
        { error: "Vendor email not found. Cannot send OTP." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your registered email.",
    })
  } catch (error) {
    console.error("[vendors/[slug]/paystack/request-change POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
