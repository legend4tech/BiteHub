// ─── Core TypeScript types for CampusBites MVP ───────────────────────────────

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

// ─── Vendor ──────────────────────────────────────────────────────────────────

export interface Vendor {
  id: string
  name: string
  slug: string
  description: string
  category: string
  tags: string[]
  whatsappNumber: string
  school: string
  campus: string
  isActive: boolean
  deliveryFee: number
  prepTime?: string
  image?: string | { url: string; publicId: string }

  // Monnify integration fields
  monnifySubAccountCode?: string
  monnifyBankCode?: string
  accountNumber?: string
  monnifyIntegrationStatus?: "pending" | "active"
  lastBankUpdateAt?: string // ISO string

  // Computed/virtual UI properties
  initials?: string
  location?: string
  tagline?: string
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string
  vendorId: string
  name: string
  description: string | null
  price: number
  category: string // Made this string instead of MenuCategory enum to match user schema flexibility
  image: string | { url: string; publicId: string } | null
  isAvailable: boolean
  availableFrom: string | null
  availableTo: string | null
  prepTimeValue: number | null
  prepTimeUnit: "minutes" | "hours" | "days" | null
  createdAt: string
  updatedAt: string

  // Fabricated UI properties
  vendorName?: string
  vendorSlug?: string
  vendorWhatsappNumber?: string // Carried from vendor so the cart can send it with the order
  vendorDeliveryFee?: number
  vendorPrepTime?: string
  tag?: string | null
}

/**
 * The shape of data sent when creating or editing a menu item.
 * Excludes server-generated fields (id, vendorId, timestamps) and
 * the UI-only vendorName which is sourced from the DB at the API level.
 */
export type MenuItemPayload = Omit<
  MenuItem,
  "id" | "vendorId" | "vendorName" | "createdAt" | "updatedAt"
>

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export interface CartState {
  items: CartItem[]
  vendorId: string | null
  vendorName: string | null
  vendorWhatsappNumber: string | null
}

// ─── Order ───────────────────────────────────────────────────────────────────

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
}

// ─── Vendor Auth Session ──────────────────────────────────────────────────────

export interface VendorSession {
  vendorId: string
  vendorName: string
  vendorPhone: string
}
