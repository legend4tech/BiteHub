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
import Order from "@/models/Order"
import { toMajorUnit } from "@/lib/money"
import { serializePromoRedemptionDetail } from "@/lib/serializers"
import type { PromoRedemptionDetail } from "@/types/promo"
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
      error:
        "All slots for this promo code have been fully redeemed. Subscribe to our newsletter so you don't miss future promos!",
    }
  }

  // 3. Hierarchical Scope Matching
  // Cross-check student profile if customer is logged in
  if (params.customerId && (promo.targetSchool || promo.targetCampus)) {
    const Customer = (await import("@/models/Customer")).default
    const customer = await Customer.findById(params.customerId)
      .select("school campus")
      .lean()

    if (customer) {
      if (
        promo.targetSchool &&
        customer.school &&
        promo.targetSchool.trim().toLowerCase() !==
          customer.school.trim().toLowerCase()
      ) {
        return {
          valid: false,
          error: `This promo code is only available to students of ${promo.targetSchool}.`,
        }
      }
      if (
        promo.targetCampus &&
        customer.campus &&
        promo.targetCampus.trim().toLowerCase() !==
          customer.campus.trim().toLowerCase()
      ) {
        return {
          valid: false,
          error: `This promo code is only available to students on ${promo.targetCampus} campus.`,
        }
      }
    }
  }

  // A. School scoping (order & guest selection)
  if (
    promo.targetSchool &&
    (!params.school ||
      promo.targetSchool.trim().toLowerCase() !==
        params.school.trim().toLowerCase())
  ) {
    return {
      valid: false,
      error: `This promo code is only valid for orders at ${promo.targetSchool}.`,
    }
  }

  // B. Campus scoping (order & guest selection)
  if (
    promo.targetCampus &&
    (!params.campus ||
      promo.targetCampus.trim().toLowerCase() !==
        params.campus.trim().toLowerCase())
  ) {
    return {
      valid: false,
      error: `This promo code is only valid for orders on ${promo.targetCampus} campus.`,
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

    if (
      promo.maxRedemptionsPerCustomer &&
      promo.maxRedemptionsPerCustomer > 0 &&
      customerRedemptionCount >= promo.maxRedemptionsPerCustomer
    ) {
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

  // Strict full-discount check: if remaining budget cannot cover the full calculated discount,
  // reject cleanly rather than issuing an unexpected partial discount.
  if (calculatedDiscountInKobo > remainingBudgetInKobo) {
    return {
      valid: false,
      error:
        "All slots for this promo code have been fully redeemed. Subscribe to our newsletter so you don't miss future promos!",
    }
  }

  // Discount cannot exceed the applicable subtotal
  calculatedDiscountInKobo = Math.min(
    calculatedDiscountInKobo,
    applicableSubtotalInKobo
  )

  if (calculatedDiscountInKobo <= 0) {
    return {
      valid: false,
      error:
        "All slots for this promo code have been fully redeemed. Subscribe to our newsletter so you don't miss future promos!",
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

  if (updatedPromo.maxRedemptionsPerCustomer) {
    const priorRedemptions = await (session
      ? PromoCodeRedemption.countDocuments(
          { promoCodeId, customerId },
          { session }
        )
      : PromoCodeRedemption.countDocuments({ promoCodeId, customerId }))
    if (priorRedemptions >= updatedPromo.maxRedemptionsPerCustomer) {
      throw new Error("Usage limit reached for this promo code.")
    }
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

export interface GetPromoRedemptionsParams {
  promoCodeId?: string | null
  page?: number
  limit?: number
}

export interface PromoRedemptionsListResult {
  redemptions: PromoRedemptionDetail[]
  total: number
  page: number
  totalPages: number
}

/**
 * Retrieves a paginated list of promo code redemptions with populated customer
 * and order details for the admin marketing dashboard.
 */
export async function getPromoRedemptions(
  params: GetPromoRedemptionsParams = {}
): Promise<PromoRedemptionsListResult> {
  await dbConnect()

  const page = Math.max(params.page || 1, 1)
  const limit = Math.min(Math.max(params.limit || 50, 1), 100)
  const skip = (page - 1) * limit

  const filter: Record<string, unknown> = {}
  if (params.promoCodeId) {
    filter.promoCodeId = params.promoCodeId
  }

  const [redemptions, total] = await Promise.all([
    PromoCodeRedemption.find(filter)
      .sort({ redeemedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customerId", "name email phone")
      .lean(),
    PromoCodeRedemption.countDocuments(filter),
  ])

  interface LeanOrderSummary {
    orderId: string
    vendorName?: string
    items?: Array<{
      menuItemId?: string
      name: string
      quantity: number
      priceInKobo: number
    }>
    totalAmountInKobo?: number
    status?: string
  }

  const orderIds = redemptions.map((r: { orderId: string }) => r.orderId)
  const orders = (await Order.find({ orderId: { $in: orderIds } })
    .select("orderId vendorName items totalAmountInKobo status createdAt")
    .lean()) as unknown as LeanOrderSummary[]

  const orderMap = new Map<string, LeanOrderSummary>(
    orders.map((o) => [o.orderId, o])
  )

  const detailedRedemptions = redemptions.map((r) => {
    const order = orderMap.get(r.orderId)
    return serializePromoRedemptionDetail({
      _id: r._id,
      code: r.code,
      promoCodeId: r.promoCodeId,
      customerId: r.customerId as {
        name?: string
        email?: string
        phone?: string
      } | null,
      orderId: r.orderId,
      discountAmountInKobo: r.discountAmountInKobo,
      redeemedAt: r.redeemedAt,
      order: order || null,
    })
  })

  return {
    redemptions: detailedRedemptions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
