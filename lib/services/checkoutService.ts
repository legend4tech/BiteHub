/**
 * checkoutService.ts
 *
 * Handles core checkout operations, calculating totals, verifying stock,
 * and creating orders.
 */

import Vendor from "@/models/Vendor"
import Order from "@/models/Order"
import Customer from "@/models/Customer"
import GlobalSettings from "@/models/GlobalSettings"
import mongoose from "mongoose"
import type { IMenuItem } from "@/models/MenuItem"
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  generateOrderId,
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
import {
  resolveDeliveryFee,
  validateOrderItemsAndCalculateTotal,
} from "@/lib/services/orderCheckoutService"
import { resolveCheckoutDiscounts } from "@/lib/services/checkoutDiscountService"
import { reserveStockAndAlertVendors } from "@/lib/services/checkoutStockService"
import { Session } from "next-auth"
import type { CheckoutResult, ProcessCheckoutData } from "@/types/customer"

export async function processCheckout(
  parsedData: ProcessCheckoutData,
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
    appliedPromoCode,
    useBHC,
  } = parsedData

  // 1. Fetch existing customer record (if any) and validate status
  const existingCustomer = await Customer.findOne({
    email: customerEmail.toLowerCase(),
  }).lean()

  const customerValidation = validateCustomerCheckoutStatus(
    existingCustomer,
    customerEmail,
    session
  )
  if (customerValidation) return customerValidation

  // 2. Fetch and validate vendor availability
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

  // 3. Resolve vouchers & promo codes with strict wallet payment invariant
  const discountResult = await resolveCheckoutDiscounts({
    appliedVoucherCode,
    appliedPromoCode,
    paymentMethod,
    session,
    existingCustomer,
    vendor,
    vendorId,
    items,
    dbMenuItemsMap,
  })

  if (!discountResult.success) {
    return {
      error: discountResult.error,
      requiresSignup: discountResult.requiresSignup,
      status: discountResult.status,
    }
  }

  const {
    sponsoredDiscountAmountInKobo,
    isRewardSponsored,
    rewardVoucherId,
    promoDiscountInKobo,
    promoCodeData,
  } = discountResult

  // 4. Financial Calculations (InKobo integer rule)
  const totalDiscountInKobo =
    sponsoredDiscountAmountInKobo + promoDiscountInKobo
  const baseCustomerPaymentInKobo = Math.max(
    0,
    calculatedTotalInKobo - totalDiscountInKobo
  )
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
  const finalFoodSubtotalInKobo = Math.max(
    0,
    foodSubtotalInKobo - totalDiscountInKobo
  )
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

  // 5. Payment gateway setup or wallet balance pre-check
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

  // 6. Execute atomic database transaction
  const mongooseSession = await mongoose.startSession()
  let transactionError: string | null = null
  let orderResponse: typeof Order.prototype | null = null

  try {
    await mongooseSession.withTransaction(async () => {
      // 6a. Lock and burn voucher if applied
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

      // 6b. Burn promo code redemption if applied
      if (promoCodeData && (existingCustomer?._id || customerForWallet?._id)) {
        const { redeemPromoCode } =
          await import("@/lib/services/promoCodeService")
        const redeemedCustomerId =
          existingCustomer?._id || customerForWallet?._id
        await redeemPromoCode({
          promoCodeId: promoCodeData.promoCodeId,
          code: promoCodeData.code,
          customerId: redeemedCustomerId!,
          orderId,
          discountAmountInKobo: promoDiscountInKobo,
          session: mongooseSession,
        })
      }

      // 6c. Reserve item quantities atomically
      try {
        await reserveStockAndAlertVendors({
          items,
          dbMenuItemsMap,
          vendorId,
          finalVendorName,
          mongooseSession,
        })
      } catch (stockErr: unknown) {
        transactionError =
          stockErr instanceof Error
            ? stockErr.message
            : "Items went out of stock"
        throw stockErr
      }

      // 6d. Create order record
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
            promoCode: promoCodeData?.code,
            promoDiscountInKobo,
          },
        ],
        { session: mongooseSession }
      )

      // 6e. Deduct funds from BiteHub Wallet
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

  const order = orderResponse!

  // 7. Fire-and-forget notification delivery
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
