import { NextResponse } from "next/server"
import crypto from "crypto"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import Order from "@/models/Order"
import Customer from "@/models/Customer"
import { auth } from "@/auth"
import MenuItem from "@/models/MenuItem"
import Landmark from "@/models/Landmark"
import SubLandmark from "@/models/SubLandmark"
import GlobalSettings from "@/models/GlobalSettings"
import { serializeOrder } from "@/lib/serializers"
import type { IMenuItem } from "@/models/MenuItem"
import {
  ORDER_STATUS,
  generateOrderId,
  LOW_STOCK_THRESHOLD,
} from "@/lib/constants"
import { computeMonnifyServiceFee } from "@/lib/fees"
import { initMonnifyTransaction } from "@/lib/monnify"
import { sendOrderInitiatedEmail } from "@/lib/mail"
import { sendVendorLowStockAlertEmail } from "@/lib/vendorAlertMail"
import { sendVendorOrderNotification } from "@/lib/whatsapp"
import {
  resolveDeliveryFee,
  validateOrderItemsAndCalculateTotal,
} from "@/lib/services/orderCheckoutService"
import { createOrderSchema } from "@/lib/schemas"

export async function GET(request: Request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      )
    }

    const order = await Order.findOne({ orderId }).lean()

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const serializedOrder = serializeOrder(order)
    return NextResponse.json(serializedOrder)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}

// ── POST /api/orders

export async function POST(request: Request) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body using Zod
    const parsedBody = createOrderSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
        { status: 400 }
      )
    }

    const {
      vendorId,
      items,
      customerName,
      customerEmail,
      customerPhone,
      location,
      exactLocation,
      notes,
      paymentMethod,
    } = parsedBody.data

    const session = await auth()

    // Fetch existing customer record (if any)
    const existingCustomer = await Customer.findOne({
      email: customerEmail.toLowerCase(),
    }).lean()

    if (existingCustomer) {
      // Any existing customer — with or without a password — must be logged in to order again.
      // First order is allowed as a guest; every subsequent order requires an account.
      if (
        !session ||
        session.user?.email?.toLowerCase() !== customerEmail.toLowerCase()
      ) {
        const hasPassword = !!existingCustomer.password
        return NextResponse.json(
          {
            error: hasPassword
              ? "An account with this email exists. Please log in to continue."
              : "Please create a free BiteHub account to continue ordering.",
            requiresLogin: true,
            requiresSignup: !hasPassword,
          },
          { status: 401 }
        )
      }
    } else {
      // First-time buyer: silently create a passwordless guest account
      const randomReferral = crypto.randomBytes(4).toString("hex")
      await Customer.create({
        name: customerName,
        email: customerEmail.toLowerCase(),
        phone: customerPhone,
        referralCode: `REF-${randomReferral.toUpperCase()}`,
        isActive: true,
      })
    }

    // Verify vendor exists and is active before accepting the order
    const vendor = await Vendor.findById(vendorId).lean()
    if (!vendor || !vendor.isActive) {
      return NextResponse.json(
        { error: "Vendor not found or inactive" },
        { status: 404 }
      )
    }

    // Securely source the vendor's WhatsApp number directly from the database (Source of Truth)
    const finalWhatsapp = vendor.whatsappNumber
    if (!finalWhatsapp) {
      return NextResponse.json(
        { error: "Vendor does not have a configured WhatsApp number" },
        { status: 400 }
      )
    }

    const finalVendorName = vendor.name

    // Server-side Price Calculation (Fixes Client-Side Pricing Trust Vulnerability)
    const deliveryFee = await resolveDeliveryFee(vendor, location)

    let calculatedTotal: number
    let maxHours: number
    let maxItemPrepTime: string
    let dbMenuItemsMap: Map<string, Partial<IMenuItem>>

    try {
      const validationResult = await validateOrderItemsAndCalculateTotal(
        items,
        vendorId,
        deliveryFee
      )
      calculatedTotal = validationResult.calculatedTotal
      maxHours = validationResult.maxHours
      maxItemPrepTime = validationResult.maxItemPrepTime
      dbMenuItemsMap = validationResult.dbMenuItemsMap as Map<
        string,
        Partial<IMenuItem>
      >
    } catch (validationError: unknown) {
      return NextResponse.json(
        {
          error:
            validationError instanceof Error
              ? validationError.message
              : "Failed to validate order items",
        },
        { status: 400 }
      )
    }

    // Gross-up formula: collect exactly enough from the customer so that after Monnify
    // takes their 1.5% cut of the total, the vendor absorbs zero processing fee.
    // See lib/fees.ts for the full derivation.
    // Note: No service fee applies for wallet payments.
    const serviceFee =
      paymentMethod === "wallet" ? 0 : computeMonnifyServiceFee(calculatedTotal)
    const finalTotal = calculatedTotal + serviceFee

    // Calculate exact revenue split
    const settings = await GlobalSettings.findOne()
    const platformFeePercentage = settings
      ? settings.platformFeePercentage
      : Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || 5)

    // Commission is calculated only on the vendor's items (food subtotal), NOT the delivery fee.
    // The vendor keeps 100% of the delivery fee.
    const foodSubtotal = calculatedTotal - deliveryFee
    const platformCommission = foodSubtotal * (platformFeePercentage / 100)
    const vendorRevenue = calculatedTotal - platformCommission

    // Generate a collision-resistant order ID first (needed for paymentReference + redirectUrl)
    const orderId = generateOrderId()
    const paymentReference = `BH-PAY-${orderId}`

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"
    const redirectUrl = `${appUrl}/order/${orderId}`

    let checkoutUrl = redirectUrl
    let transactionReference = ""
    let orderStatus: string = ORDER_STATUS.PENDING
    let paymentStatus: string = "pending"

    if (paymentMethod === "wallet") {
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "Please log in to pay with wallet" },
          { status: 401 }
        )
      }
      const customer = await Customer.findOne({
        email: session.user.email,
      }).lean()
      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        )
      }

      const Wallet = (await import("@/models/Wallet")).default
      const wallet = await Wallet.findOne({ customerId: customer._id })

      if (!wallet || wallet.balance < finalTotal) {
        return NextResponse.json(
          { error: "Insufficient wallet balance" },
          { status: 400 }
        )
      }

      wallet.balance -= finalTotal
      await wallet.save()

      const WalletTransaction = (await import("@/models/WalletTransaction"))
        .default
      await WalletTransaction.create({
        customerId: customer._id,
        type: "order_payment",
        amount: finalTotal,
        reference: `ORD-${orderId}`,
        description: `Payment for order ${orderId}`,
      })

      orderStatus = ORDER_STATUS.CONFIRMED
      paymentStatus = "paid"
    } else {
      if (!vendor.monnifySubAccountCode) {
        return NextResponse.json(
          {
            error:
              "This vendor is not connected to Monnify. Cannot process payment.",
          },
          { status: 400 }
        )
      }

      const vendorSplitAmount = Math.round(vendorRevenue * 100) / 100

      try {
        const monnifyInit = await initMonnifyTransaction({
          amount: finalTotal,
          paymentReference,
          customerName,
          customerEmail,
          paymentDescription: `BiteHub Order ${orderId} from ${finalVendorName}`,
          vendorSubAccountCode: vendor.monnifySubAccountCode,
          vendorSplitAmount,
          redirectUrl,
        })
        checkoutUrl = monnifyInit.checkoutUrl
        transactionReference = monnifyInit.transactionReference
      } catch (monnifyError: unknown) {
        const errMsg =
          monnifyError instanceof Error ? monnifyError.message : "Unknown error"
        console.error("[POST /api/orders] Monnify init failed:", errMsg)
        return NextResponse.json(
          { error: "Failed to initialize payment. Please try again." },
          { status: 502 }
        )
      }
    }

    // Reserve quantity by decrementing immediately
    const bulkOps = items.map((item) => {
      const dbItem = dbMenuItemsMap.get(item.menuItemId)
      const updateDoc: {
        $inc: { quantityAvailable: number }
        $set?: { lowStockAlertSent: boolean }
      } = { $inc: { quantityAvailable: -item.quantity } }

      if (
        dbItem &&
        dbItem.quantityAvailable !== null &&
        dbItem.quantityAvailable !== undefined
      ) {
        const newQuantity = dbItem.quantityAvailable - item.quantity
        if (newQuantity <= LOW_STOCK_THRESHOLD && !dbItem.lowStockAlertSent) {
          updateDoc.$set = { lowStockAlertSent: true }
          // Fire-and-forget — alert must not block the checkout response
          sendVendorLowStockAlertEmail(
            vendorId,
            finalVendorName,
            dbItem.name || "Unknown Item",
            newQuantity
          ).catch((err) =>
            console.error("[POST /api/orders] Low stock alert failed:", err)
          )
        }
      }

      return {
        updateOne: {
          filter: { _id: item.menuItemId, quantityAvailable: { $ne: null } },
          update: updateDoc,
        },
      }
    })
    if (bulkOps.length > 0) {
      await MenuItem.bulkWrite(bulkOps).catch((err) => {
        console.error("[POST /api/orders] Failed to decrement quantity:", err)
      })
    }

    const order = await Order.create({
      orderId,
      vendorId,
      vendorName: finalVendorName,
      vendorWhatsappNumber: finalWhatsapp,
      vendorPrepTime: maxHours !== -1 ? maxItemPrepTime : vendor.prepTime || "",
      items,
      customerName,
      customerEmail,
      customerPhone,
      location: `${exactLocation} (${location})`,
      notes: notes || "",
      deliveryFee,
      serviceFee,
      platformCommission,
      vendorRevenue,
      totalAmount: finalTotal,
      status: orderStatus,
      paymentMethod,
      paymentStatus,
      monnifyReference:
        paymentMethod === "monnify" ? paymentReference : undefined,
      expiresAt: new Date(Date.now() + 30 * 60000), // 30 minutes from now
    })

    if (paymentMethod === "wallet") {
      // For wallet, it is paid instantly. Fire all completion hooks now.
      const { sendOrderReceiptEmail, sendVendorNewOrderEmail } =
        await import("@/lib/mail")

      sendOrderReceiptEmail(
        customerEmail,
        customerName,
        orderId,
        finalVendorName,
        finalTotal,
        deliveryFee,
        serviceFee,
        items,
        redirectUrl
      ).catch(console.error)

      if (finalWhatsapp) {
        sendVendorOrderNotification(
          finalWhatsapp,
          customerName,
          orderId,
          vendorRevenue
        ).catch(console.error)
      }

      sendVendorNewOrderEmail(
        String(vendorId),
        finalVendorName,
        orderId,
        customerName,
        customerPhone,
        location,
        items,
        deliveryFee,
        serviceFee,
        finalTotal,
        vendorRevenue,
        platformCommission,
        notes || undefined
      ).catch(console.error)
    } else {
      // Float the promise so it sends asynchronously without blocking the checkout redirect
      sendOrderInitiatedEmail(
        customerEmail,
        customerName,
        order.orderId,
        finalVendorName,
        finalTotal,
        redirectUrl
      ).catch(console.error)
    }

    return NextResponse.json(
      { orderId: order.orderId, checkoutUrl, transactionReference },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/orders] Error creating order:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}
