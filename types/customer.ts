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
  vendorDeliveryFee: number
  vendorPrepTime: string | null
  vendorMonnifySubaccountCode: string | null
}

export interface OrderRecord {
  id?: string
  _id?: { toString: () => string }
  orderId: string
  vendorName: string
  totalAmount: number
  status: string
  paymentStatus?: string
  location: string
  createdAt: string | Date
  items: Array<{ name: string; quantity: number; price: number }>
}

export interface Transaction {
  id?: string
  _id?: { toString: () => string }
  type: string
  amount: number
  balanceAfter?: number
  direction?: "credit" | "debit"
  description?: string
  status?: string
  reference: string
  createdAt: string | Date
}

export interface CustomerOrdersPageData {
  orders: OrderRecord[]
  page: number
  hasMore: boolean
  totalOrders: number
}

export interface CustomerProfile {
  name: string
  email: string
  phone: string
  school?: string
  campus?: string
  preferredLandmark?: string
  preferredSubLandmark?: string
  preferredExactLocation?: string
  image?: string
  imagePublicId?: string
}
