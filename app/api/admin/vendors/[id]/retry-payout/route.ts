import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import Order from "@/models/Order"
import { auth } from "@/auth"
import { ORDER_STATUS } from "@/lib/constants"
import { executeBulkDisbursement } from "@/lib/monnify"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
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

    // Rate-limit by admin user ID — prevents rapid double-payout triggering
    if (isRateLimitingEnabled) {
      const { success } = await strictRateLimiter.limit(
        `admin_retry_payout_${session.user.id}`
      )
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
    }

    await dbConnect()

    const vendorId = params.id

    // Atomically find and lock the vendor
    const vendor = await Vendor.findOneAndUpdate(
      { _id: vendorId, isDisbursing: { $ne: true } },
      { $set: { isDisbursing: true } },
      { new: true }
    )

    if (!vendor) {
      // Vendor either doesn't exist or is currently being disbursed
      const existingVendor = await Vendor.findById(vendorId)
      if (!existingVendor) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
      } else {
        return NextResponse.json(
          { error: "A payout for this vendor is already in progress" },
          { status: 423 }
        ) // 423 Locked
      }
    }

    if (!vendor.pendingWalletBalance || vendor.pendingWalletBalance <= 0) {
      // Unlock before returning error
      await Vendor.findByIdAndUpdate(vendor._id, {
        $set: { isDisbursing: false },
      })
      return NextResponse.json(
        { error: "No pending wallet balance to disburse" },
        { status: 400 }
      )
    }

    if (!vendor.monnifyAccountNumber || !vendor.monnifyBankCode) {
      // Unlock before returning error
      await Vendor.findByIdAndUpdate(vendor._id, {
        $set: { isDisbursing: false },
      })
      return NextResponse.json(
        { error: "Vendor has not set up their Monnify bank details" },
        { status: 400 }
      )
    }

    const batchReference = `retry-payout-${vendor._id}-${Date.now()}`
    const amountPaid = vendor.pendingWalletBalance

    // Execute Bulk Disbursement via Monnify
    const bulkResult = await executeBulkDisbursement({
      batchReference,
      title: "BiteHub Admin Wallet Payout Retry",
      narration: `Manual wallet payout retry for ${vendor.name}`,
      transactions: [
        {
          amount: amountPaid,
          reference: `payout-${vendor._id}-${Date.now()}`,
          narration: `BiteHub Wallet Payout - ${vendor.name}`,
          bankCode: vendor.monnifyBankCode,
          accountNumber: vendor.monnifyAccountNumber,
        },
      ],
    })

    // If API call didn't throw, we assume success. Update local DB.
    await Vendor.findByIdAndUpdate(vendor._id, {
      $set: { isDisbursing: false },
      $inc: {
        walletTotalDisbursed: amountPaid,
        pendingWalletBalance: -amountPaid,
      },
    })

    // Mark the corresponding wallet orders as disbursed
    await Order.updateMany(
      {
        vendorId: vendor._id,
        paymentMethod: "wallet",
        paymentStatus: "paid",
        isDisbursed: { $ne: true },
      },
      { $set: { isDisbursed: true } }
    )

    return NextResponse.json({
      message: "Payout retry successful",
      bulkResult,
    })
  } catch (error) {
    console.error(`[POST /api/admin/vendors/${params.id}/retry-payout]`, error)

    // Attempt to unlock on failure
    try {
      await Vendor.findByIdAndUpdate(params.id, {
        $set: { isDisbursing: false },
      })
    } catch (e) {
      console.error(
        `Failed to unlock vendor ${params.id} after payout error:`,
        e
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    )
  }
}
