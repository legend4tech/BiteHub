import { formatPrice } from "./format"
import type { MenuCategory, OrderStatus } from "@/types/shared"

// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = "BiteHub"
export const APP_TAGLINE = "Food right when you need it."
export const APP_BASE_URL = "https://bitehubapp.com"
export const APP_LOGO_URL = "/brand_logo.png"
/** Full absolute URL for use inside email templates (must be publicly hosted). */
export const APP_LOGO_EMAIL_URL = `${APP_BASE_URL}/brand_logo.png`
export const CURRENT_TERMS_VERSION = "2026-05-27"
export const SUPPORT_EMAIL = "contact@bitehubapp.com"
export const CONTACT_EMAIL = "contact@bitehubapp.com"
export const NO_REPLY_EMAIL = "no-reply@bitehubapp.com"
export const LOW_STOCK_THRESHOLD = 5
export const PLATFORM_FLAT_FEE = 150

// ─── Discovery Score Weights ───────────────────────────────────────────────────
// Used by menuService.ts to rank items on the /menus page (Recommended sort).
// Adjust here only — never hardcode these values inline.

export const DISCOVERY_SCORE = {
  /** Featured vendor override — always floats above unrated/new items */
  FEATURED_BOOST: 1000,
  /** Multiplied by vendor star rating (0–5) → up to +100 pts */
  RATING_MULTIPLIER: 20,
  /** Multiplied by log(ratingCount + 1) — diminishing returns on review count */
  REVIEW_COUNT_MULTIPLIER: 5,
  /** Flat bonus when the item is orderable right now */
  AVAILABILITY_BOOST: 50,
  /** Maximum recency bonus (decays linearly to 0 over RECENCY_DECAY_DAYS) */
  RECENCY_MAX: 30,
  /** Days over which the recency bonus decays to zero */
  RECENCY_DECAY_DAYS: 30,
  /** Maximum consecutive slots a single vendor may occupy in ranked results */
  MAX_CONSECUTIVE_VENDOR_SLOTS: 4,
} as const

// ─── localStorage Keys ────────────────────────────────────────────────────────

export const LS_CART = "cb_cart"
export const SS_ACCEPTED_CROSS_CAMPUS = "accepted_cross_campus"

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

export const VALID_ORDER_STATUSES = Object.values(
  ORDER_STATUS
) as OrderStatusType[]

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const
export type PaymentStatusType =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

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
  { label: string; className: string; textColor: string; description: string }
> = {
  [ORDER_STATUS.PENDING]: {
    label: "Pending",
    className: "border-primary/20 bg-primary/10 text-primary",
    textColor: "text-primary",
    description: "Waiting for vendor to confirm",
  },
  [ORDER_STATUS.CONFIRMED]: {
    label: "Payment Confirmed",
    className:
      "border-status-confirmed/20 bg-status-confirmed/10 text-status-confirmed",
    textColor: "text-status-confirmed",
    description: "Payment for order confirmed",
  },
  [ORDER_STATUS.PREPARING]: {
    label: "Preparing",
    className:
      "border-status-preparing/20 bg-status-preparing/10 text-status-preparing",
    textColor: "text-status-preparing",
    description: "Your food is being prepared",
  },
  [ORDER_STATUS.READY]: {
    label: "Out for delivery",
    className: "border-status-ready/20 bg-status-ready/10 text-status-ready",
    textColor: "text-status-ready",
    description: "Your order is on the way!",
  },
  [ORDER_STATUS.COMPLETED]: {
    label: "Completed",
    className:
      "border-status-completed/20 bg-status-completed/10 text-status-completed",
    textColor: "text-status-completed",
    description: "Order completed successfully",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Cancelled",
    className:
      "border-status-cancelled/20 bg-status-cancelled/10 text-status-cancelled",
    textColor: "text-status-cancelled",
    description: "Order was cancelled",
  },
}
// ─── Vendor Categories ────────────────────────────────────────────────────────

export const VENDOR_CATEGORIES = [
  { value: "meals", label: "Meals (e.g. Rice, Swallow)" },
  { value: "fast-food", label: "Fast Food (e.g. Shawarma, Pastries, cakes)" },
  { value: "drinks", label: "Drinks (e.g. Smoothies, Soft Drinks)" },
] as const

// ─── Schools & Campuses (Legacy - Use lib/config/campus.ts) ──────────────

// ─── Category Config ──────────────────────────────────────────────────────────

export const MENU_CATEGORIES: {
  value: "all" | MenuCategory
  label: string
  image: string
}[] = [
  {
    value: "all",
    label: "All",
    image: "/rice.jpg",
  },
  {
    value: "rice",
    label: "Rice",
    image: "/rice.jpg",
  },
  {
    value: "soup",
    label: "Soups",
    image: "/soup.jpg",
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
    image: "/smoothie.jpg",
  },
  {
    value: "protein",
    label: "Proteins",
    image: "/chicken.png",
  },
  {
    value: "shawarma",
    label: "Shawarma",
    image: "/sharwama.jpg",
  },
  {
    value: "food",
    label: "Food",
    image: "/bole.jpg",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()
  return `BH-${ts}-${rand}`
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
  paymentMethod?: "monnify"
  paymentStatus?: string
}): string {
  const itemList = order.items
    .map(
      (i) => `• ${i.name} ×${i.quantity} — ${formatPrice(i.price * i.quantity)}`
    )
    .join("\n")

  // Monnify is the only payment method — show confirmation when paid
  const paymentText =
    order.paymentMethod === "monnify" ? `*Payment:* Paid via Monnify` : null

  return [
    `Hello! I just placed an order from your menu via *${APP_NAME}* 🍽️`,
    ``,
    `*Order ID:* ${order.orderId}`,
    `*Name:* ${order.customerName}`,
    ``,
    `*Items:*`,
    itemList,
    ``,
    `*Total:* ${formatPrice(order.totalAmount ?? order.total ?? 0)}`,
    paymentText,
    order.notes ? `*Notes:* ${order.notes}` : null,
    ``,
    `Please confirm when you receive this. Thank you! 🙏`,
  ]
    .filter((l) => l !== null)
    .join("\n")
}
