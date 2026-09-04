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
  price: number
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
  deliveryFee: number
  status: OrderStatus
  serviceFee: number
  platformCommission: number
  vendorRevenue: number
  totalAmount: number
  createdAt: string // ISO string
  updatedAt: string // ISO string
  paymentMethod?: "monnify"
  paymentStatus?: "pending" | "paid" | "failed"
  monnifyReference?: string
  vendorPaymentDetails?: {
    bankName?: string
    accountNumber?: string
    accountName?: string
    acceptsCashOnDelivery?: boolean
  }
  isRated?: boolean
}
