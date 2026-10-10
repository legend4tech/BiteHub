import type { MenuItem } from "./vendor"

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export interface CartState {
  items: CartItem[]
  vendorId: string | null
  vendorName: string | null
  vendorWhatsappNumber: string | null
  vendorDeliveryFeeInKobo: number
  vendorPrepTime: string | null
  vendorMonnifySubaccountCode: string | null
}

export interface OrderRecord {
  id?: string
  _id?: { toString: () => string }
  orderId: string
  vendorName: string
  totalAmountInKobo: number
  status: string
  paymentStatus?: string
  location: string
  createdAt: string | Date
  items: Array<{
    name: string
    quantity: number
    priceInKobo: number
    image?: string
  }>
}

export interface Transaction {
  id?: string
  _id?: { toString: () => string }
  type: string
  amountInKobo: number
  balanceAfterInKobo?: number
  direction?: "credit" | "debit"
  description?: string
  status?: string
  reference: string
  createdAt: string | Date
  remainingAmountInKobo?: number
  expiresAt?: string | Date
}

export interface CustomerOrdersPageData {
  orders: OrderRecord[]
  page: number
  hasMore: boolean
  totalOrders: number
}

export interface CustomerProfile {
  name: string
  username?: string
  email: string
  phone: string
  school?: string
  campus?: string
  preferredLandmark?: string
  preferredSubLandmark?: string
  preferredExactLocation?: string
  image?: string
  imagePublicId?: string
  receivesMarketing?: boolean
  acceptedTermsVersion?: string
}

export interface CustomerReviewOrder {
  id: string
  orderId: string
  vendorId: string
  vendorName: string
  vendor: {
    id: string
    name: string
    image?: { url: string }
    slug: string
  } | null
  items: {
    menuItemId: string
    name: string
    priceInKobo: number
    quantity: number
    image?: string
  }[]
  totalAmountInKobo: number
  createdAt: string
  status: string
  isFullyRated: boolean
  isVendorRated: boolean
  ratedItems: string[]
  existingItemReviews?: {
    menuItemId: string
    rating: number
    title: string
    comments?: string
    isAnonymous: boolean
    createdAt?: string
  }[]
}

export interface CustomerReviewRecord {
  id: string
  vendor: { id: string; name: string; image?: { url: string }; slug: string }
  rating: number
  comments: string | null
  updatedAt: string
  orderId: string
}

/**
 * Result of processCheckout. Discriminated on `error` so callers can narrow
 * with `if (result.error)` before reading the success fields.
 */
export type CheckoutResult =
  | {
      error: string
      status: number
      requiresLogin?: boolean
      requiresSignup?: boolean
    }
  | {
      error?: undefined
      status: number
      orderId: string
      checkoutUrl: string
      transactionReference: string
    }
