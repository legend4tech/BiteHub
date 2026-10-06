export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"

export type MenuCategory =
  | "rice"
  | "soup"
  | "snack"
  | "drink"
  | "protein"
  | "shawarma"
  | "food"

export interface OrderItem {
  menuItemId: string
  name: string
  priceInKobo: number
  quantity: number
}

export interface Order {
  id: string
  orderId: string
  vendorId: string
  vendorName: string
  vendorWhatsappNumber: string
  vendorPrepTime?: string | null
  items: OrderItem[]
  customerName: string
  customerPhone: string
  location: string
  notes?: string | null
  deliveryFeeInKobo: number
  status: OrderStatus
  serviceFeeInKobo: number
  platformCommissionInKobo: number
  vendorRevenueInKobo: number
  totalAmountInKobo: number
  createdAt: string // ISO string
  updatedAt: string // ISO string
  paymentMethod?: "monnify" | "wallet"
  paymentStatus?: "pending" | "paid" | "failed"
  monnifyReference?: string
  vendorPaymentDetails?: {
    bankName?: string
    accountNumber?: string
    accountName?: string
    acceptsCashOnDelivery?: boolean
  }
  isFullyRated?: boolean
}

export interface SubmitFeedbackPayload {
  orderId?: string
  vendorId?: string
  platform?: {
    rating: number
    comments?: string
  }
  vendor?: {
    vendorId: string
    rating: number
    comments?: string
    isAnonymous?: boolean
  }
}

export interface Bank {
  name: string
  code: string
  cbnCode: string
  baseCode: string
}

export interface SystemLandmark {
  id: string
  name: string
  school: string
  campus: string
  defaultDeliveryFeeInKobo: number
  subLandmarks?: {
    id: string
    landmarkId: string
    name: string
    defaultDeliveryFeeInKobo: number | null
    isActive: boolean
    createdAt: string
    updatedAt: string
  }[]
}
