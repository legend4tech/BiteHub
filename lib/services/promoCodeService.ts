/**
 * promoCodeService.ts
 *
 * Single source of truth for all promo code operations.
 * Validates hierarchical scoping, enforces budget bounds, customer usage limits,
 * and records atomic redemptions during order checkout.
 */

import dbConnect from "@/lib/db"
import PromoCode, { IPromoCode } from "@/models/PromoCode"
import PromoCodeRedemption from "@/models/PromoCodeRedemption"
import { toMajorUnit } from "@/lib/money"
import type { ClientSession, Types } from "mongoose"

export interface CartItemInput {
  menuItemId: string
  priceInKobo: number
  quantity: number
}

export interface ValidatePromoParams {
  code: string
  customerId?: string | null
  vendorId: string
  campus?: string | null
  school?: string | null
  items: CartItemInput[]
}

export interface PromoValidationSuccess {
  valid: true
  promoCodeId: string
  code: string
  title: string
  description: string | null
  discountAmountInKobo: number
}

export interface PromoValidationFailure {
  valid: false
  error: string
}

export type PromoValidationResult =
  | PromoValidationSuccess
  | PromoValidationFailure

/**
 * Validates a promo code against cart items, vendor, campus/school hierarchy,
 * budget availability, and customer redemption limits.
 */
export async function validatePromoCode(
  params: ValidatePromoParams
): Promise<PromoValidationResult> {
  await dbConnect()

  const normalizedCode = params.code.trim().toUpperCase()
  if (!normalizedCode) {
    return { valid: false, error: "Please enter a valid promo code." }
  }

  const promo = await PromoCode.findOne({
    code: normalizedCode,
    isActive: true,
  }).lean<IPromoCode>()

  if (!promo) {
    return { valid: false, error: "Invalid promo code." }
  }

  // 1. Date window validation
  const now = new Date()
  if (promo.startDate && new Date(promo.startDate) > now) {
    return { valid: false, error: "This promo code is not active yet." }
  }
  if (promo.endDate && new Date(promo.endDate) < now) {
    return { valid: false, error: "This promo code has expired." }
  }

  // 2. Global redemption and budget checks
  if (
    promo.maxRedemptions &&
    promo.currentRedemptions >= promo.maxRedemptions
  ) {
    return {
      valid: false,
      error: "This promo code has reached its maximum redemptions.",
    }
  }

  const remainingBudgetInKobo =
    promo.budgetAllocatedInKobo - (promo.budgetSpentInKobo || 0)
  if (remainingBudgetInKobo <= 0) {
    return {
      valid: false,
      error: "The budget for this promo has been fully redeemed.",
    }
  }

  // 3. Hierarchical Scope Matching
  // A. School scoping
  if (promo.targetSchool && params.school) {
    if (
      promo.targetSchool.trim().toLowerCase() !==
      params.school.trim().toLowerCase()
    ) {
      return {
        valid: false,
        error: `This promo code is only valid at ${promo.targetSchool}.`,
      }
    }
  }

  // B. Campus scoping
  if (promo.targetCampus && params.campus) {
    if (
      promo.targetCampus.trim().toLowerCase() !==
      params.campus.trim().toLowerCase()
    ) {
      return {
        valid: false,
        error: `This promo code is only valid for ${promo.targetCampus} campus.`,
      }
    }
  }

  // C. Vendor scoping (e.g. DoorDash hack for a specific restaurant)
  if (promo.targetVendorId) {
    const promoVendorIdStr = promo.targetVendorId.toString()
    if (promoVendorIdStr !== params.vendorId) {
      return {
        valid: false,
        error: "This promo code is only valid for a specific restaurant.",
      }
    }
  }

  // D. Specific meal scoping
  let applicableSubtotalInKobo = 0
  const foodSubtotalInKobo = params.items.reduce(
    (sum, item) => sum + item.priceInKobo * item.quantity,
    0
  )

  if (promo.targetMenuItemId) {
    const targetedItems = params.items.filter(
      (i) => i.menuItemId === promo.targetMenuItemId
    )
    if (targetedItems.length === 0) {
      return {
        valid: false,
        error: "This promo code applies to a specific meal not in your cart.",
      }
    }
    applicableSubtotalInKobo = targetedItems.reduce(
      (sum, item) => sum + item.priceInKobo * item.quantity,
      0
    )
  } else {
    applicableSubtotalInKobo = foodSubtotalInKobo
  }

  // 4. Minimum order subtotal check
  if (
    promo.minOrderValueInKobo &&
    foodSubtotalInKobo < promo.minOrderValueInKobo
  ) {
    const minNaira = toMajorUnit(promo.minOrderValueInKobo)
    return {
      valid: false,
      error: `Minimum food order of ₦${minNaira.toLocaleString()} required to use this code.`,
    }
  }

  // 5. Customer redemption limit check
  if (params.customerId) {
    const customerRedemptionCount = await PromoCodeRedemption.countDocuments({
      promoCodeId: promo._id,
      customerId: params.customerId,
    })

    if (customerRedemptionCount >= promo.maxRedemptionsPerCustomer) {
      return {
        valid: false,
        error: "You have already used this promo code.",
      }
    }
  }

  // 6. Discount Calculation (Strict Integer InKobo Math)
  let calculatedDiscountInKobo = 0

  if (promo.discountType === "PERCENTAGE") {
    const percentage = promo.discountPercentage || 0
    calculatedDiscountInKobo = Math.round(
      applicableSubtotalInKobo * (percentage / 100)
    )
    if (promo.maxDiscountInKobo) {
      calculatedDiscountInKobo = Math.min(
        calculatedDiscountInKobo,
        promo.maxDiscountInKobo
      )
    }
  } else {
    calculatedDiscountInKobo = promo.discountValueInKobo
  }

  // Discount cannot exceed the applicable subtotal or the remaining promo budget
  calculatedDiscountInKobo = Math.min(
    calculatedDiscountInKobo,
    applicableSubtotalInKobo,
    remainingBudgetInKobo
  )

  if (calculatedDiscountInKobo <= 0) {
    return {
      valid: false,
      error: "The budget for this promo has been fully redeemed.",
    }
  }

  return {
    valid: true,
    promoCodeId: promo._id.toString(),
    code: promo.code,
    title: promo.title,
    description: promo.description ?? null,
    discountAmountInKobo: calculatedDiscountInKobo,
  }
}

/**
 * Atomically burns a promo code redemption and records the customer usage.
 */
export async function redeemPromoCode(params: {
  promoCodeId: string | Types.ObjectId
  code: string
  customerId: string | Types.ObjectId
  orderId: string
  discountAmountInKobo: number
  session?: ClientSession
}) {
  await dbConnect()

  const {
    promoCodeId,
    code,
    customerId,
    orderId,
    discountAmountInKobo,
    session,
  } = params

  const updatedPromo = await PromoCode.findOneAndUpdate(
    {
      _id: promoCodeId,
      isActive: true,
      $expr: {
        $and: [
          {
            $lte: [
              { $add: ["$budgetSpentInKobo", discountAmountInKobo] },
              "$budgetAllocatedInKobo",
            ],
          },
          {
            $or: [
              { $eq: ["$maxRedemptions", null] },
              { $not: ["$maxRedemptions"] },
              { $lt: ["$currentRedemptions", "$maxRedemptions"] },
            ],
          },
        ],
      },
    },
    {
      $inc: {
        budgetSpentInKobo: discountAmountInKobo,
        currentRedemptions: 1,
      },
    },
    { session, new: true }
  )

  if (!updatedPromo) {
    throw new Error(
      "Promo code budget or redemption limit was exceeded during checkout."
    )
  }

  const redemptionDoc = {
    promoCodeId,
    code: code.trim().toUpperCase(),
    customerId,
    orderId,
    discountAmountInKobo,
    redeemedAt: new Date(),
  }

  if (session) {
    await PromoCodeRedemption.create([redemptionDoc], { session })
  } else {
    await PromoCodeRedemption.create(redemptionDoc)
  }
}
