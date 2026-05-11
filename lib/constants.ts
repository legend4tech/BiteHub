import { formatPrice } from "./format"
import type { MenuCategory, OrderStatus } from "./types"

// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = "CampusBites"
export const CAMPUS_NAME = "COOU Uli"

// ─── localStorage Keys ────────────────────────────────────────────────────────

export const LS_CART = "cb_cart"
export const LS_ORDERS = "cb_orders"
export const LS_VENDOR_SESSION = "cb_vendor_session"
export const LS_VENDORS = "cb_vendors" // admin-created vendors

// ─── Role Constants ───────────────────────────────────────────────────────────

export const ROLES = {
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
  VENDOR: "vendor",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const VALID_ROLES = Object.values(ROLES) as UserRole[]

// ─── Order Status Constants ───────────────────────────────────────────────────

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

export type OrderStatusType = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const VALID_ORDER_STATUSES = Object.values(ORDER_STATUS) as OrderStatusType[]

// Maintain backward compatibility with existing type
export const ORDER_STATUS_STEPS: OrderStatus[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.COMPLETED,
]

// ─── Order Status Config ──────────────────────────────────────────────────────

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string; description: string }
> = {
  [ORDER_STATUS.PENDING]: {
    label: "Pending",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    description: "Waiting for vendor to confirm",
  },
  [ORDER_STATUS.CONFIRMED]: {
    label: "Confirmed",
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    description: "Vendor confirmed your order",
  },
  [ORDER_STATUS.PREPARING]: {
    label: "Preparing",
    className:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    description: "Your food is being prepared",
  },
  [ORDER_STATUS.READY]: {
    label: "Ready for pickup",
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    description: "Your order is ready!",
  },
  [ORDER_STATUS.COMPLETED]: {
    label: "Completed",
    className: "bg-muted text-muted-foreground border-border",
    description: "Order completed successfully",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Cancelled",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    description: "Order was cancelled",
  },
}

// ─── Category Config ──────────────────────────────────────────────────────────

export const MENU_CATEGORIES: {
  value: "all" | MenuCategory
  label: string
  image: string
}[] = [
  {
    value: "all",
    label: "All",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
  },
  {
    value: "rice",
    label: "Rice",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop",
  },
  {
    value: "soup",
    label: "Soups",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop",
  },
  {
    value: "snack",
    label: "Snacks",
    image:
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop",
  },
  {
    value: "drink",
    label: "Drinks",
    image:
      "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&h=400&fit=crop",
  },
  {
    value: "protein",
    label: "Proteins",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop",
  },
  {
    value: "shawarma",
    label: "Shawarma",
    image:
      "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&h=400&fit=crop",
  },
  {
    value: "food",
    label: "Food",
    image:
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600&h=400&fit=crop",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `COOU-${ts}-${rand}`
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "")
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

export function buildOrderWhatsAppMessage(order: {
  orderId: string
  customerName: string
  items: { name: string; quantity: number; price: number }[]
  total?: number // legacy support
  totalAmount?: number // from serializer
  notes?: string
}): string {
  const itemList = order.items
    .map(
      (i) => `• ${i.name} ×${i.quantity} — ${formatPrice(i.price * i.quantity)}`
    )
    .join("\n")

  return [
    `Hello! I'd like to place an order on *${APP_NAME}* 🍽️`,
    ``,
    `*Order ID:* ${order.orderId}`,
    `*Name:* ${order.customerName}`,
    ``,
    `*Items:*`,
    itemList,
    ``,
    `*Total:* ${formatPrice(order.totalAmount ?? order.total ?? 0)}`,
    order.notes ? `*Notes:* ${order.notes}` : null,
    ``,
    `Please confirm when you receive this. Thank you! 🙏`,
  ]
    .filter((l) => l !== null)
    .join("\n")
}

// Vendor default password for MVP — all vendors share this password
export const VENDOR_DEFAULT_PASSWORD = "vendor123"
export const ADMIN_PHONE = "admin"
export const ADMIN_PASSWORD = "admin123"
