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
  _id: { toString: () => string }
  orderId: string
  vendorName: string
  totalAmount: number
  status: string
  location: string
  createdAt: string | Date
  items: Array<{ name: string; quantity: number; price: number }>
}

export interface Transaction {
  _id: { toString: () => string }
  type: string
  amount: number
  description?: string
  status: string
  reference: string
  createdAt: string | Date
}
