import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Vendor from "@/models/Vendor"
import Order from "@/models/Order"
import MenuItem from "@/models/MenuItem"
import Landmark from "@/models/Landmark"
import SubLandmark from "@/models/SubLandmark"
import GlobalSettings from "@/models/GlobalSettings"
import { serializeOrder } from "@/lib/serializers"
import { ORDER_STATUS, generateOrderId } from "@/lib/constants"
import { computeMonnifyServiceFee } from "@/lib/fees"
import { initMonnifyTransaction } from "@/lib/monnify"
import { sendOrderInitiatedEmail } from "@/lib/mail"
import {
  getPrepTimeInHours,
  isPreorderPrepTime,
  formatPrepTime,
  isItemAvailableToday,
} from "@/lib/format"
import { z } from "zod"

const orderItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
})

const createOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorWhatsappNumber: z.string().optional(),
  vendorPhone: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(1, "Customer phone is required"),
  location: z.string().min(1, "Location is required"),
  exactLocation: z.string().min(1, "Exact location is required"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["monnify"]).default("monnify"),
  total: z.number().optional(), // We accept it but ignore it for calculation
})

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
    } = parsedBody.data

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
    let deliveryFee = vendor.deliveryFee || 0 // Fallback for legacy locations

    const landmarks = await Landmark.find({
      school: vendor.school,
      campus: vendor.campus,
    }).lean()
    const subLandmarks = await SubLandmark.find({
      landmarkId: { $in: landmarks.map((l) => l._id) },
    }).lean()

    let deliveryZoneMatched = false
    for (const lm of landmarks) {
      if (location === lm.name) {
        // Matched main landmark directly
        const vendorLmOverride = vendor.landmarkOverrides?.find(
          (o: { landmarkId: string; fee: number }) =>
            String(o.landmarkId) === String(lm._id)
        )
        if (vendorLmOverride) {
          deliveryFee = vendorLmOverride.fee
        } else {
          deliveryFee = lm.defaultDeliveryFee
        }
        deliveryZoneMatched = true
        break
      }

      for (const sub of subLandmarks) {
        if (
          String(sub.landmarkId) === String(lm._id) &&
          location === `${lm.name} - ${sub.name}`
        ) {
          // Found matching delivery zone, resolve fee
          const vendorSubOverride = vendor.subLandmarkOverrides?.find(
            (o: { subLandmarkId: string; fee: number }) =>
              String(o.subLandmarkId) === String(sub._id)
          )
          const vendorLmOverride = vendor.landmarkOverrides?.find(
            (o: { landmarkId: string; fee: number }) =>
              String(o.landmarkId) === String(lm._id)
          )

          if (vendorSubOverride) {
            deliveryFee = vendorSubOverride.fee
          } else if (vendorLmOverride) {
            deliveryFee = vendorLmOverride.fee
          } else if (
            sub.defaultDeliveryFee !== undefined &&
            sub.defaultDeliveryFee !== null
          ) {
            deliveryFee = sub.defaultDeliveryFee
          } else {
            deliveryFee = lm.defaultDeliveryFee
          }
          deliveryZoneMatched = true
          break
        }
      }
      if (deliveryZoneMatched) break
    }

    let calculatedTotal = deliveryFee
    const itemIds = items.map((item) => item.menuItemId)
    const dbMenuItems = await MenuItem.find({
      _id: { $in: itemIds },
      vendorId,
    }).lean()
    const dbMenuItemsMap = new Map(
      dbMenuItems.map((item) => [item._id.toString(), item])
    )

    // Helper to check if current time in Nigeria is within availability window
    const lagosDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    )
    const currentHourStr = lagosDate.getHours().toString().padStart(2, "0")
    const currentMinStr = lagosDate.getMinutes().toString().padStart(2, "0")
    const currentTimeStr = `${currentHourStr}:${currentMinStr}`

    let maxHours = -1
    let maxItemPrepTime = ""

    for (const item of items) {
      const dbItem = dbMenuItemsMap.get(item.menuItemId)
      if (!dbItem) {
        return NextResponse.json(
          { error: `Menu item not found: ${item.name}` },
          { status: 404 }
        )
      }

      // Block ordering if the vendor manually unlisted the item
      if (dbItem.isAvailable === false) {
        return NextResponse.json(
          {
            error: `Sorry, ${dbItem.name} is currently out of stock or unavailable.`,
          },
          { status: 400 }
        )
      }

      // Block ordering if the meal is not available today
      if (!isItemAvailableToday(dbItem.availableDays)) {
        return NextResponse.json(
          {
            error: `Sorry, ${dbItem.name} is not available today.`,
          },
          { status: 400 }
        )
      }

      // Block ordering if quantity is insufficient
      if (
        dbItem.quantityAvailable !== null &&
        dbItem.quantityAvailable !== undefined
      ) {
        if (dbItem.quantityAvailable < item.quantity) {
          return NextResponse.json(
            {
              error: `Sorry, only ${dbItem.quantityAvailable} portions of ${dbItem.name} are available. Please reduce your quantity.`,
            },
            { status: 400 }
          )
        }
      }

      // Block ordering if it's outside the meal's time window
      if (dbItem.availableFrom && currentTimeStr < dbItem.availableFrom) {
        return NextResponse.json(
          {
            error: `Sorry, ${dbItem.name} is only available starting from ${dbItem.availableFrom}.`,
          },
          { status: 400 }
        )
      }
      if (dbItem.availableTo && currentTimeStr > dbItem.availableTo) {
        return NextResponse.json(
          {
            error: `Sorry, ${dbItem.name} is no longer available (ended at ${dbItem.availableTo}).`,
          },
          { status: 400 }
        )
      }

      if (dbItem.prepTimeValue && dbItem.prepTimeUnit) {
        const hours = getPrepTimeInHours(
          dbItem.prepTimeValue,
          dbItem.prepTimeUnit
        )

        if (hours > maxHours) {
          maxHours = hours
          const isPreorder = isPreorderPrepTime(
            dbItem.prepTimeValue,
            dbItem.prepTimeUnit
          )
          maxItemPrepTime = isPreorder
            ? `Pre-order: ${formatPrepTime(dbItem.prepTimeValue, dbItem.prepTimeUnit)}`
            : `${formatPrepTime(dbItem.prepTimeValue, dbItem.prepTimeUnit)}`
        }
      }

      calculatedTotal += dbItem.price * item.quantity

      // Update item price to the actual DB price just to be safe
      item.price = dbItem.price
    }

    // Gross-up formula: collect exactly enough from the customer so that after Monnify
    // takes their 1.5% cut of the total, the vendor absorbs zero processing fee.
    // See lib/fees.ts for the full derivation.
    const serviceFee = computeMonnifyServiceFee(calculatedTotal)
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

    if (!vendor.monnifySubAccountCode) {
      return NextResponse.json(
        {
          error:
            "This vendor is not connected to Monnify. Cannot process payment.",
        },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"
    const redirectUrl = `${appUrl}/order/${orderId}`

    // Use splitAmount (exact NGN) instead of splitPercentage.
    // vendorRevenue = calculatedTotal × (1 - platformFee%) — the vendor's clean share of
    // the base subtotal (food + delivery), before the service fee.
    //
    // Why splitAmount and NOT splitPercentage:
    //   - The customer pays a gross-up service fee on top of the base total.
    //   - That service fee is sized to exactly cover Monnify's 1.5% processing charge.
    //   - With splitPercentage, the service fee gets split 98/2 between vendor and platform,
    //     so the platform's 2% commission is nearly wiped out by Monnify's charge.
    //   - With splitAmount, the vendor receives exactly their base share. The remaining
    //     balance (service fee + platform commission) stays with the merchant contract, and
    //     Monnify deducts its fee from that remainder — leaving the platform with a clean
    //     net commission ≈ platformFee% × base.
    const vendorSplitAmount = Math.round(vendorRevenue * 100) / 100

    let checkoutUrl: string
    let transactionReference: string
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

    // Reserve quantity by decrementing immediately
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.menuItemId, quantityAvailable: { $ne: null } },
        update: { $inc: { quantityAvailable: -item.quantity } },
      },
    }))
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
      status: ORDER_STATUS.PENDING,
      paymentMethod: "monnify",
      paymentStatus: "pending",
      monnifyReference: paymentReference,
      expiresAt: new Date(Date.now() + 30 * 60000), // 30 minutes from now
    })

    // Float the promise so it sends asynchronously without blocking the checkout redirect
    sendOrderInitiatedEmail(
      customerEmail,
      customerName,
      order.orderId,
      finalVendorName,
      finalTotal,
      redirectUrl
    ).catch(console.error)

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
