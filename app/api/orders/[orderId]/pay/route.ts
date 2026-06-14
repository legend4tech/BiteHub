import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/models/Order"
import Vendor from "@/models/Vendor"
import { initMonnifyTransaction } from "@/lib/monnify"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    await dbConnect()

    const order = await Order.findOne({ orderId }).lean()
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "pending" || order.paymentStatus !== "pending") {
      return NextResponse.json(
        { error: "Order is no longer pending payment." },
        { status: 400 }
      )
    }

    const vendor = await Vendor.findById(order.vendorId).lean()
    if (!vendor || !vendor.monnifySubAccountCode) {
      return NextResponse.json(
        { error: "Vendor payment configuration is missing." },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"
    const redirectUrl = `${appUrl}/order/${order.orderId}`
    const vendorSplitAmount = Math.round(order.vendorRevenue * 100) / 100

    // Generate a fresh payment reference to avoid "Duplicate payment reference" from Monnify
    const newPaymentReference = `BH-PAY-${order.orderId}-${Date.now()}`

    let checkoutUrl: string
    let transactionReference: string

    try {
      const monnifyInit = await initMonnifyTransaction({
        amount: order.totalAmount,
        paymentReference: newPaymentReference,
        customerName: order.customerName,
        customerEmail: order.customerEmail || "",
        paymentDescription: `BiteHub Order ${order.orderId} from ${order.vendorName}`,
        vendorSubAccountCode: vendor.monnifySubAccountCode,
        vendorSplitAmount,
        redirectUrl,
      })
      checkoutUrl = monnifyInit.checkoutUrl
      transactionReference = monnifyInit.transactionReference

      // Update the order with the new reference so /verify checks the latest attempt
      await Order.updateOne(
        { _id: order._id },
        { $set: { monnifyReference: newPaymentReference } }
      )
    } catch (monnifyError: unknown) {
      const errMsg =
        monnifyError instanceof Error ? monnifyError.message : "Unknown error"
      console.error(
        "[POST /api/orders/[orderId]/pay] Monnify init failed:",
        errMsg
      )
      return NextResponse.json(
        { error: "Failed to initialize payment recovery." },
        { status: 502 }
      )
    }

    return NextResponse.json({ checkoutUrl, transactionReference })
  } catch (error) {
    console.error("[POST /api/orders/[orderId]/pay] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
