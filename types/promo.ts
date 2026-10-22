import type { PromoDiscountType } from "@/lib/constants"
export type { PromoDiscountType }

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

export interface PromoRedemptionDetail {
  id: string
  code: string
  promoCodeId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  orderId: string
  vendorName: string
  items: Array<{
    menuItemId?: string
    name: string
    quantity: number
    priceInKobo: number
  }>
  totalAmountInKobo: number
  orderStatus: string
  discountAmountInKobo: number
  redeemedAt: string
}
