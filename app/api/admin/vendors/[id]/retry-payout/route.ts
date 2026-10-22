import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import Order from "@/models/Order"
import { auth } from "@/auth"
import { executeBulkDisbursement } from "@/lib/monnify"
import { isRateLimitingEnabled, strictRateLimiter } from "@/lib/rate-limit"
import { toMajorUnit } from "@/lib/money"
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
    const batchReference = `retry-payout-${vendorId}-${Date.now()}`
    // Atomically find and lock the vendor with disbursementBatchId
    const vendor = await Vendor.findOneAndUpdate(
      { _id: vendorId, isDisbursing: { $ne: true } },
      { $set: { isDisbursing: true, disbursementBatchId: batchReference } },
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
    if (
      !vendor.pendingWalletBalanceInKobo ||
      vendor.pendingWalletBalanceInKobo <= 0
    ) {
      // Unlock before returning error
      await Vendor.findByIdAndUpdate(vendor._id, {
        $set: { isDisbursing: false, disbursementBatchId: null },
      })
      return NextResponse.json(
        { error: "No pending wallet balance to disburse" },
        { status: 400 }
      )
    }
    if (!vendor.monnifyAccountNumber || !vendor.monnifyBankCode) {
      // Unlock before returning error
      await Vendor.findByIdAndUpdate(vendor._id, {
        $set: { isDisbursing: false, disbursementBatchId: null },
      })
      return NextResponse.json(
        { error: "Vendor has not set up their Monnify bank details" },
        { status: 400 }
      )
    }
    const amountPaidInKobo = vendor.pendingWalletBalanceInKobo
    const transactionRef = `payout-${vendor._id}-${Date.now()}`

    // Execute Bulk Disbursement via Monnify
    const bulkResult = await executeBulkDisbursement({
      batchReference,
      title: "BiteHub Admin Wallet Payout Retry",
      narration: `Manual wallet payout retry for ${vendor.name}`,
      transactions: [
        {
          amount: toMajorUnit(amountPaidInKobo),
          reference: transactionRef,
          narration: `BiteHub Wallet Payout - ${vendor.name}`,
          destinationBankCode: vendor.monnifyBankCode,
          destinationAccountNumber: vendor.monnifyAccountNumber,
          destinationAccountName: vendor.name,
          currency: "NGN",
        },
      ],
    })
    // If API call didn't throw, we assume success. Update local DB.
    await Vendor.findByIdAndUpdate(vendor._id, {
      $set: { isDisbursing: false, disbursementBatchId: null },
      $inc: {
        walletTotalDisbursedInKobo: amountPaidInKobo,
        pendingWalletBalanceInKobo: -amountPaidInKobo,
      },
    })
    // Mark the exact wallet orders that contributed to this specific payout amount
    const { ORDER_STATUS } = await import("@/lib/constants")
    const pendingOrders = await Order.find({
      vendorId: vendor._id,
      paymentMethod: "wallet",
      paymentStatus: "paid",
      status: { $ne: ORDER_STATUS.CANCELLED },
      isDisbursed: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .select("_id vendorRevenueInKobo")
      .lean()

    let runningTotal = 0
    const orderIdsToMark = []

    for (const po of pendingOrders) {
      if (runningTotal + po.vendorRevenueInKobo > amountPaidInKobo) {
        break
      }
      runningTotal += po.vendorRevenueInKobo
      orderIdsToMark.push(po._id)
    }

    if (orderIdsToMark.length > 0) {
      await Order.updateMany(
        { _id: { $in: orderIdsToMark } },
        { $set: { isDisbursed: true, payoutReference: transactionRef } }
      )
    }
    return NextResponse.json({
      message: "Payout retry successful",
      bulkResult,
    })
  } catch (error) {
    console.error(`[POST /api/admin/vendors/${params.id}/retry-payout]`, error)
    // Attempt to unlock on failure
    try {
      await Vendor.findByIdAndUpdate(params.id, {
        $set: { isDisbursing: false, disbursementBatchId: null },
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
