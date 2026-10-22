/**
 * checkoutDiscountService.ts
 *
 * Dedicated service for validating and computing discounts (Vouchers and Promo Codes)
 * during checkout. Enforces wallet-only settlement and customer authentication invariants.
 */

import mongoose from "mongoose"
import type { Session } from "next-auth"
import type { IMenuItem } from "@/models/MenuItem"
import { validatePromoCode } from "@/lib/services/promoCodeService"

export interface ResolveDiscountsParams {
  appliedVoucherCode?: string
  appliedPromoCode?: string
  paymentMethod: string
  session: Session | null
  existingCustomer: { _id: mongoose.Types.ObjectId; email: string } | null
  vendor: {
    _id: unknown
    campus?: string
    school?: string
  }
  vendorId: string
  items: {
    menuItemId: string
    name: string
    quantity: number
    priceInKobo: number
  }[]
  dbMenuItemsMap: Map<string, Partial<IMenuItem>>
}

export interface DiscountResolutionSuccess {
  success: true
  sponsoredDiscountAmountInKobo: number
  isRewardSponsored: boolean
  rewardVoucherId?: mongoose.Types.ObjectId
  promoDiscountInKobo: number
  promoCodeData: { promoCodeId: string; code: string } | null
}

export interface DiscountResolutionError {
  success: false
  error: string
  requiresSignup?: boolean
  status: number
}

export type DiscountResolutionResult =
  | DiscountResolutionSuccess
  | DiscountResolutionError

export async function resolveCheckoutDiscounts(
  params: ResolveDiscountsParams
): Promise<DiscountResolutionResult> {
  const {
    appliedVoucherCode,
    appliedPromoCode,
    paymentMethod,
    session,
    existingCustomer,
    vendor,
    vendorId,
    items,
    dbMenuItemsMap,
  } = params

  if (appliedPromoCode && appliedVoucherCode) {
    return {
      success: false,
      error:
        "You cannot use both a voucher and a promo code on the same order.",
      status: 400,
    }
  }

  // 1. Invariant: All discounts require Wallet payment method
  if (appliedVoucherCode || appliedPromoCode) {
    if (paymentMethod !== "wallet") {
      return {
        success: false,
        error:
          "You must use your BiteHub Wallet to pay when using promo codes or rewards. Please select Wallet as your payment method.",
        status: 400,
      }
    }

    // 2. Invariant: Guests cannot possess a wallet or redeem subsidies
    if (!existingCustomer || !session?.user?.email) {
      return {
        success: false,
        error:
          "You must be logged in to your BiteHub account to use a promo code or voucher.",
        requiresSignup: true,
        status: 401,
      }
    }
  }

  let sponsoredDiscountAmountInKobo = 0
  let isRewardSponsored = false
  let rewardVoucherId: mongoose.Types.ObjectId | undefined = undefined

  // 3. Voucher Verification
  if (appliedVoucherCode && existingCustomer) {
    const RewardVoucher = (await import("@/models/RewardVoucher")).default
    const voucher = await RewardVoucher.findOne({
      code: appliedVoucherCode,
      customerId: existingCustomer._id,
    })

    if (!voucher) {
      return { success: false, error: "Invalid voucher code.", status: 400 }
    }
    if (voucher.isUsed) {
      return {
        success: false,
        error: "This voucher has already been used.",
        status: 400,
      }
    }
    if (voucher.expiresAt < new Date()) {
      return { success: false, error: "This voucher has expired.", status: 400 }
    }
    const itemInCart = items.find((i) => i.menuItemId === voucher.menuItemId)
    if (!itemInCart) {
      return {
        success: false,
        error: "The meal for this voucher is not in your cart.",
        status: 400,
      }
    }

    sponsoredDiscountAmountInKobo = itemInCart.priceInKobo
    isRewardSponsored = true
    rewardVoucherId = voucher._id
  }

  let promoDiscountInKobo = 0
  let promoCodeData: { promoCodeId: string; code: string } | null = null

  // 4. Promo Code Verification
  if (appliedPromoCode && existingCustomer) {
    // Ground-truth database sanitization against client tampering
    const sanitizedItemsForPromo = items.map((item) => {
      const dbItem = dbMenuItemsMap.get(item.menuItemId)
      return {
        menuItemId: item.menuItemId,
        priceInKobo: dbItem?.priceInKobo ?? item.priceInKobo,
        quantity: item.quantity,
      }
    })

    const promoRes = await validatePromoCode({
      code: appliedPromoCode,
      customerId: existingCustomer._id.toString(),
      vendorId,
      campus: vendor.campus,
      school: vendor.school,
      items: sanitizedItemsForPromo,
    })

    if (!promoRes.valid) {
      return { success: false, error: promoRes.error, status: 400 }
    }

    promoDiscountInKobo = promoRes.discountAmountInKobo
    promoCodeData = { promoCodeId: promoRes.promoCodeId, code: promoRes.code }
  }

  return {
    success: true,
    sponsoredDiscountAmountInKobo,
    isRewardSponsored,
    rewardVoucherId,
    promoDiscountInKobo,
    promoCodeData,
  }
}
