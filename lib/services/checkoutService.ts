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
  PLATFORM_FLAT_FEE_IN_KOBO,
  UNPAID_ORDER_EXPIRY_MINUTES,
} from "@/lib/constants"
import { computeMonnifyServiceFee } from "@/lib/fees"
import { initMonnifyTransaction } from "@/lib/monnify"
import {
  sendCheckoutNotifications,
  validateCustomerCheckoutStatus,
} from "@/lib/services/checkoutHelpers"
import { processWalletPaymentDeduction } from "@/lib/services/checkoutWalletHelpers"
import { sendVendorLowStockAlertEmail } from "@/lib/vendorAlertMail"
import {
  resolveDeliveryFee,
  validateOrderItemsAndCalculateTotal,
} from "@/lib/services/orderCheckoutService"
import { Session } from "next-auth"
import type { CheckoutResult } from "@/types/customer"

export async function processCheckout(
  parsedData: {
    vendorId: string
    items: {
      menuItemId: string
      name: string
      quantity: number
      priceInKobo: number
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
): Promise<CheckoutResult> {
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

  const customerValidation = validateCustomerCheckoutStatus(
    existingCustomer,
    customerEmail,
    session
  )
  if (customerValidation) return customerValidation

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

  const deliveryFeeInKobo = await resolveDeliveryFee(vendor, location)

  let calculatedTotalInKobo: number
  let maxHours: number
  let maxItemPrepTime: string
  let dbMenuItemsMap: Map<string, Partial<IMenuItem>>

  try {
    const validationResult = await validateOrderItemsAndCalculateTotal(
      items,
      vendorId,
      deliveryFeeInKobo
    )
    calculatedTotalInKobo = validationResult.calculatedTotal
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

  let sponsoredDiscountAmountInKobo = 0
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
    const voucher = await RewardVoucher.findOne({
      code: appliedVoucherCode,
      customerId: existingCustomer._id,
    })

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

    sponsoredDiscountAmountInKobo = itemInCart.priceInKobo
    isRewardSponsored = true
    rewardVoucherId = voucher._id
  }

  const baseCustomerPaymentInKobo =
    calculatedTotalInKobo - sponsoredDiscountAmountInKobo
  const targetAmountToReceiveInKobo =
    baseCustomerPaymentInKobo + PLATFORM_FLAT_FEE_IN_KOBO
  const monnifyFeeInKobo =
    paymentMethod === "wallet"
      ? 0
      : computeMonnifyServiceFee(targetAmountToReceiveInKobo)
  const serviceFeeInKobo = monnifyFeeInKobo + PLATFORM_FLAT_FEE_IN_KOBO
  const finalTotalInKobo = baseCustomerPaymentInKobo + serviceFeeInKobo

  const settings = await GlobalSettings.findOne()
  const platformFeePercentage = settings
    ? settings.platformFeePercentage
    : Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || 5)

  const foodSubtotalInKobo = calculatedTotalInKobo - deliveryFeeInKobo
  const finalFoodSubtotalInKobo =
    foodSubtotalInKobo - sponsoredDiscountAmountInKobo
  const rawPlatformCommissionInKobo =
    foodSubtotalInKobo * (platformFeePercentage / 100)
  const platformCommissionInKobo = Math.round(rawPlatformCommissionInKobo)
  const vendorRevenueInKobo = Math.round(
    calculatedTotalInKobo - platformCommissionInKobo
  )

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

    if (!walletCheck || walletCheck.balanceInKobo < finalTotalInKobo) {
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

    const vendorSplitAmountInKobo = vendorRevenueInKobo

    try {
      const { toMajorUnit } = await import("@/lib/money")
      const monnifyInit = await initMonnifyTransaction({
        amount: toMajorUnit(finalTotalInKobo),
        paymentReference,
        customerName,
        customerEmail,
        paymentDescription: `BiteHub Order ${orderId} from ${finalVendorName}`,
        vendorSubAccountCode: vendor.monnifySubAccountCode,
        vendorSplitAmount: toMajorUnit(vendorSplitAmountInKobo),
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
          { $inc: { budgetSpentInKobo: sponsoredDiscountAmountInKobo } },
          { session: mongooseSession }
        )
      }

      // Reserve quantity by decrementing immediately
      const bulkOps = items.map(
        (item: {
          menuItemId: string
          name: string
          quantity: number
          priceInKobo: number
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
            customerId: existingCustomer?._id,
            customerName,
            customerEmail,
            customerPhone,
            location: `${exactLocation} (${location})`,
            notes: notes || "",
            deliveryFeeInKobo,
            serviceFeeInKobo,
            platformCommissionInKobo,
            vendorRevenueInKobo,
            totalAmountInKobo: finalTotalInKobo,
            status: orderStatus,
            paymentMethod,
            paymentStatus,
            monnifyReference:
              paymentMethod === "monnify" ? paymentReference : undefined,
            expiresAt: new Date(
              Date.now() + UNPAID_ORDER_EXPIRY_MINUTES * 60_000
            ),
            isRewardSponsored,
            sponsoredDiscountAmountInKobo,
            rewardVoucherId,
          },
        ],
        { session: mongooseSession }
      )

      if (paymentMethod === "wallet" && customerForWallet) {
        try {
          await processWalletPaymentDeduction(
            customerForWallet,
            finalTotalInKobo,
            useBHC,
            orderId,
            vendorId,
            vendorRevenueInKobo,
            order,
            mongooseSession,
            finalFoodSubtotalInKobo
          )
        } catch (err: unknown) {
          if (err instanceof Error && err.message === "Insufficient balance") {
            transactionError =
              "Insufficient wallet balance during checkout. Order cancelled."
            throw err
          }
          throw err
        }

        // The voucher has already been marked used and the budget decremented earlier in this transaction.
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

  await sendCheckoutNotifications({
    paymentMethod,
    customerEmail,
    customerName,
    customerPhone,
    orderId: order.orderId,
    finalVendorName,
    finalTotalInKobo,
    deliveryFeeInKobo,
    serviceFeeInKobo,
    discountAmountInKobo:
      sponsoredDiscountAmountInKobo + (order.walletPromoAmountUsedInKobo || 0),
    vendorRevenueInKobo,
    platformCommissionInKobo,
    items,
    redirectUrl,
    finalWhatsapp,
    vendorId,
    location,
    notes,
    customerForWallet,
  })

  return {
    orderId: order.orderId,
    checkoutUrl,
    transactionReference,
    status: 201,
  }
}
