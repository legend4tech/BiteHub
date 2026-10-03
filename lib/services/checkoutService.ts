/**
 * checkoutService.ts
 *
 * Handles core checkout operations, calculating totals, verifying stock,
 * and creating orders.
 */

import Vendor from "@/models/Vendor"
import Order from "@/models/Order"
import Customer from "@/models/Customer"
import MenuItem from "@/models/MenuItem"
import GlobalSettings from "@/models/GlobalSettings"
import mongoose from "mongoose"
import type { IMenuItem } from "@/models/MenuItem"
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  generateOrderId,
  LOW_STOCK_THRESHOLD,
  PLATFORM_FLAT_FEE,
} from "@/lib/constants"
import { computeMonnifyServiceFee } from "@/lib/fees"
import { initMonnifyTransaction } from "@/lib/monnify"
import { sendVendorLowStockAlertEmail } from "@/lib/vendorAlertMail"
import { sendVendorOrderNotification } from "@/lib/whatsapp"
import {
  resolveDeliveryFee,
  validateOrderItemsAndCalculateTotal,
} from "@/lib/services/orderCheckoutService"
import { Session } from "next-auth"

export async function processCheckout(
  parsedData: {
    vendorId: string
    items: {
      menuItemId: string
      name: string
      quantity: number
      price: number
    }[]
    customerName: string
    customerEmail: string
    customerPhone: string
    location: string
    exactLocation: string
    notes?: string
    paymentMethod: string
    appliedVoucherCode?: string
    useBHC?: boolean
  },
  session: Session | null
) {
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
    appliedVoucherCode,
    useBHC,
  } = parsedData

  // Fetch existing customer record (if any)
  const existingCustomer = await Customer.findOne({
    email: customerEmail.toLowerCase(),
  }).lean()

  if (existingCustomer) {
    const isCustomerRole = session?.user?.role === "customer"
    const isAuthenticatedCustomer =
      isCustomerRole &&
      session.user?.email?.toLowerCase() === customerEmail.toLowerCase()

    const isOwnEmailDifferentRole =
      session?.user &&
      session.user.role !== "customer" &&
      session.user.email?.toLowerCase() === customerEmail.toLowerCase()

    if (!isAuthenticatedCustomer && !isOwnEmailDifferentRole) {
      const hasPassword = !!existingCustomer.password
      return {
        error: hasPassword
          ? "An account with this email exists. Please log in to continue."
          : "Please create a free BiteHub account to continue ordering.",
        requiresLogin: true,
        requiresSignup: !hasPassword,
        status: 401,
      }
    }
  }

  const vendor = await Vendor.findById(vendorId).lean()
  if (!vendor || !vendor.isActive) {
    return { error: "Vendor not found or inactive", status: 404 }
  }

  if (vendor.isOpen === false) {
    return {
      error:
        "Vendor is currently closed and not accepting orders at this time.",
      status: 400,
    }
  }

  const finalWhatsapp = vendor.whatsappNumber
  if (!finalWhatsapp) {
    return {
      error: "Vendor does not have a configured WhatsApp number",
      status: 400,
    }
  }

  const finalVendorName = vendor.name

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
    return {
      error:
        validationError instanceof Error
          ? validationError.message
          : "Failed to validate order items",
      status: 400,
    }
  }

  let sponsoredDiscountAmount = 0
  let isRewardSponsored = false
  let rewardVoucherId: mongoose.Types.ObjectId | undefined = undefined

  if (appliedVoucherCode) {
    if (paymentMethod !== "wallet") {
      return {
        error:
          "You must use your BiteHub Wallet to pay when using rewards. Please select Wallet as your payment method.",
        status: 400,
      }
    }
    if (!existingCustomer) {
      return { error: "You must be logged in to use a voucher.", status: 401 }
    }
    const RewardVoucher = (await import("@/models/RewardVoucher")).default
    const voucher = await RewardVoucher.findOne({ code: appliedVoucherCode })

    if (!voucher) {
      return { error: "Invalid voucher code.", status: 400 }
    }
    if (voucher.isUsed) {
      return { error: "This voucher has already been used.", status: 400 }
    }
    if (voucher.expiresAt < new Date()) {
      return { error: "This voucher has expired.", status: 400 }
    }
    const itemInCart = items.find((i) => i.menuItemId === voucher.menuItemId)
    if (!itemInCart) {
      return {
        error: "The meal for this voucher is not in your cart.",
        status: 400,
      }
    }

    sponsoredDiscountAmount = itemInCart.price
    isRewardSponsored = true
    rewardVoucherId = voucher._id
  }

  const baseCustomerPayment = calculatedTotal - sponsoredDiscountAmount
  const targetAmountToReceive = baseCustomerPayment + PLATFORM_FLAT_FEE
  const monnifyFee =
    paymentMethod === "wallet"
      ? 0
      : computeMonnifyServiceFee(targetAmountToReceive)
  const serviceFee = monnifyFee + PLATFORM_FLAT_FEE
  const finalTotal = baseCustomerPayment + serviceFee

  const settings = await GlobalSettings.findOne()
  const platformFeePercentage = settings
    ? settings.platformFeePercentage
    : Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || 5)

  const foodSubtotal = calculatedTotal - deliveryFee
  const rawPlatformCommission = foodSubtotal * (platformFeePercentage / 100)
  const platformCommission = Math.round(rawPlatformCommission * 100) / 100
  const vendorRevenue =
    Math.round((calculatedTotal - platformCommission) * 100) / 100

  const orderId = generateOrderId()
  const paymentReference = `BH-PAY-${orderId}`

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"
  const redirectUrl = `${appUrl}/order/${orderId}`

  let checkoutUrl = redirectUrl
  let transactionReference = ""
  const orderStatus: string = ORDER_STATUS.PENDING
  const paymentStatus: string = PAYMENT_STATUS.PENDING

  let customerForWallet = null

  if (paymentMethod === "wallet") {
    if (!session?.user?.email) {
      return { error: "Please log in to pay with wallet", status: 401 }
    }
    const customer = await Customer.findOne({
      email: session.user.email,
    }).lean()
    if (!customer) {
      return { error: "Customer not found", status: 404 }
    }
    customerForWallet = customer

    const Wallet = (await import("@/models/Wallet")).default
    const walletCheck = await Wallet.findOne({
      customerId: customerForWallet._id,
    })

    if (!walletCheck || walletCheck.balance < finalTotal) {
      return { error: "Insufficient wallet balance", status: 400 }
    }
  } else {
    if (!vendor.monnifySubAccountCode) {
      return {
        error:
          "This vendor is not connected to Monnify. Cannot process payment.",
        status: 400,
      }
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
      return {
        error: "Failed to initialize payment. Please try again.",
        status: 502,
      }
    }
  }

  const mongooseSession = await mongoose.startSession()
  let transactionError: string | null = null
  let orderResponse: typeof Order.prototype | null = null

  try {
    await mongooseSession.withTransaction(async () => {
      // 1. Lock and mark voucher as used (if applied)
      if (appliedVoucherCode) {
        const RewardVoucher = (await import("@/models/RewardVoucher")).default
        const lockedVoucher = await RewardVoucher.findOne({
          code: appliedVoucherCode,
        }).session(mongooseSession)
        if (
          !lockedVoucher ||
          lockedVoucher.isUsed ||
          lockedVoucher.expiresAt < new Date()
        ) {
          transactionError = "Voucher became invalid during checkout."
          throw new Error("Voucher invalid")
        }
        lockedVoucher.isUsed = true
        lockedVoucher.usedAt = new Date()
        await lockedVoucher.save({ session: mongooseSession })

        const RewardCampaign = (await import("@/models/RewardCampaign")).default
        await RewardCampaign.findByIdAndUpdate(
          lockedVoucher.campaignId,
          { $inc: { budgetSpent: sponsoredDiscountAmount } },
          { session: mongooseSession }
        )
      }

      // Reserve quantity by decrementing immediately
      const bulkOps = items.map(
        (item: {
          menuItemId: string
          name: string
          quantity: number
          price: number
        }) => {
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
            if (
              newQuantity <= LOW_STOCK_THRESHOLD &&
              !dbItem.lowStockAlertSent
            ) {
              updateDoc.$set = { lowStockAlertSent: true }
              // Fire-and-forget
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
              filter: {
                _id: item.menuItemId,
                quantityAvailable: { $ne: null },
              },
              update: updateDoc,
            },
          }
        }
      )
      if (bulkOps.length > 0) {
        await MenuItem.bulkWrite(bulkOps, { session: mongooseSession }).catch(
          (err) => {
            console.error(
              "[POST /api/orders] Failed to decrement quantity:",
              err
            )
          }
        )
      }

      const [order] = await Order.create(
        [
          {
            orderId,
            vendorId,
            vendorName: finalVendorName,
            vendorWhatsappNumber: finalWhatsapp,
            vendorPrepTime:
              maxHours !== -1 ? maxItemPrepTime : vendor.prepTime || "",
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
            isRewardSponsored,
            sponsoredDiscountAmount,
            rewardVoucherId,
          },
        ],
        { session: mongooseSession }
      )

      if (paymentMethod === "wallet" && customerForWallet) {
        const Wallet = (await import("@/models/Wallet")).default
        const lockedWallet = await Wallet.findOne({
          customerId: customerForWallet._id,
          balance: { $gte: finalTotal },
        }).session(mongooseSession)

        if (!lockedWallet) {
          transactionError =
            "Insufficient wallet balance during checkout. Order cancelled."
          throw new Error("Insufficient balance")
        }

        const promoDeduction = useBHC
          ? Math.min(lockedWallet.promoBalance || 0, finalTotal)
          : 0
        const depositDeduction = finalTotal - promoDeduction

        if ((lockedWallet.depositBalance || 0) < depositDeduction) {
          transactionError =
            "Insufficient deposit balance to cover the total without using BiteHub Coins."
          throw new Error("Insufficient balance")
        }

        lockedWallet.promoBalance -= promoDeduction
        lockedWallet.depositBalance =
          (lockedWallet.depositBalance || 0) - depositDeduction
        lockedWallet.balance -= finalTotal

        await lockedWallet.save({ session: mongooseSession })
        const updatedWallet = lockedWallet

        const WalletTransaction = (await import("@/models/WalletTransaction"))
          .default
        await WalletTransaction.create(
          [
            {
              customerId: customerForWallet._id,
              type: "order_payment",
              amount: finalTotal,
              balanceAfter: updatedWallet.balance,
              direction: "debit",
              reference: `ORD-${orderId}`,
              description: `Payment for order ${orderId}`,
            },
          ],
          { session: mongooseSession }
        )

        await Vendor.findByIdAndUpdate(
          vendor._id,
          {
            $inc: { pendingWalletBalance: vendorRevenue },
          },
          { session: mongooseSession }
        )

        order.walletPromoAmountUsed = promoDeduction
        order.walletDepositAmountUsed = depositDeduction
        order.status = ORDER_STATUS.CONFIRMED
        order.paymentStatus = PAYMENT_STATUS.PAID
        await order.save({ session: mongooseSession })
      }

      orderResponse = order
    })
  } catch (error) {
    if (!transactionError) {
      console.error("[POST /api/orders] Checkout transaction aborted:", error)
      return {
        error: "An error occurred during checkout processing.",
        status: 500,
      }
    }
  } finally {
    mongooseSession.endSession()
  }

  if (transactionError) {
    return { error: transactionError, status: 400 }
  }

  const order = orderResponse

  if (paymentMethod === "wallet" && customerForWallet) {
    const { sendOrderReceiptEmail, sendVendorNewOrderEmail } =
      await import("@/lib/mail")
    sendOrderReceiptEmail(
      customerEmail,
      customerName,
      order.orderId,
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
        order.orderId,
        vendorRevenue
      ).catch(console.error)
    }

    sendVendorNewOrderEmail(
      String(vendorId),
      finalVendorName,
      order.orderId,
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
    const { sendOrderInitiatedEmail } = await import("@/lib/mail")
    sendOrderInitiatedEmail(
      customerEmail,
      customerName,
      order.orderId,
      finalVendorName,
      finalTotal,
      redirectUrl
    ).catch(console.error)
  }

  return {
    orderId: order.orderId,
    checkoutUrl,
    transactionReference,
    status: 201,
  }
}
