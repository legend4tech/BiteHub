import { formatPrice } from "./format"
import type { MenuCategory, OrderStatus } from "./types"

// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = "BiteHub"
export const APP_LOGO_URL = "/brand_logo.png"

// ─── localStorage Keys ────────────────────────────────────────────────────────

export const LS_CART = "cb_cart"

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
    className: "border-primary/20 bg-primary/10 text-primary",
    description: "Waiting for vendor to confirm",
  },
  [ORDER_STATUS.CONFIRMED]: {
    label: "Confirmed",
    className:
      "border-status-confirmed/20 bg-status-confirmed/10 text-status-confirmed",
    description: "Vendor confirmed your order",
  },
  [ORDER_STATUS.PREPARING]: {
    label: "Preparing",
    className:
      "border-status-preparing/20 bg-status-preparing/10 text-status-preparing",
    description: "Your food is being prepared",
  },
  [ORDER_STATUS.READY]: {
    label: "Ready for pickup",
    className: "border-status-ready/20 bg-status-ready/10 text-status-ready",
    description: "Your order is ready!",
  },
  [ORDER_STATUS.COMPLETED]: {
    label: "Completed",
    className:
      "border-status-completed/20 bg-status-completed/10 text-status-completed",
    description: "Order completed successfully",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Cancelled",
    className:
      "border-status-cancelled/20 bg-status-cancelled/10 text-status-cancelled",
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
  paymentMethod?: "transfer" | "cash"
  paymentStatus?: string
}): string {
  const itemList = order.items
    .map(
      (i) => `• ${i.name} ×${i.quantity} — ${formatPrice(i.price * i.quantity)}`
    )
    .join("\n")

  const paymentText =
    order.paymentMethod === "transfer"
      ? `*Payment:* Transferred (Please see my receipt)`
      : order.paymentMethod === "cash"
      ? `*Payment:* Cash on delivery`
      : null

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
