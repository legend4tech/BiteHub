export type PromoDiscountType = "FIXED_AMOUNT" | "PERCENTAGE"

export interface PromoCode {
  id: string
  code: string
  title: string
  description: string | null

  targetSchool: string | null
  targetCampus: string | null
  targetVendorId: string | null
  targetMenuItemId: string | null

  discountType: PromoDiscountType
  discountValueInKobo: number
  discountPercentage: number | null
  maxDiscountInKobo: number | null
  minOrderValueInKobo: number | null

  budgetAllocatedInKobo: number
  budgetSpentInKobo: number
  maxRedemptions: number | null
  currentRedemptions: number
  maxRedemptionsPerCustomer: number

  isActive: boolean
  startDate: string
  endDate: string | null

  createdAt: string
  updatedAt: string
}

export interface PromoCodeRedemption {
  id: string
  promoCodeId: string
  code: string
  customerId: string
  orderId: string
  discountAmountInKobo: number
  redeemedAt: string
}

export interface ValidatePromoCodeResult {
  valid: boolean
  code: string
  title: string
  description: string | null
  discountAmountInKobo: number
  error?: string
}
