// ─── Shared admin types ───────────────────────────────────────────────────────

export interface AdminStats {
  totalVendors: number
  activeVendors: number
  totalOrders: number
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  totalRevenue: number
}

export interface VendorAccount {
  email: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminVendor {
  id: string
  name: string
  slug: string
  description: string
  category: string
  whatsappNumber: string
  campus: string
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  image?: { url: string; publicId: string }
  account: VendorAccount | null
}

export interface AdminOrder {
  id: string
  orderId: string
  customerName: string
  customerPhone: string
  vendorName: string
  vendorWhatsappNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalAmount: number
  items: {
    name: string
    quantity: number
    price: number
  }[]
  createdAt: string
}
