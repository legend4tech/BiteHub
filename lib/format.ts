import { toMajorUnit } from "@/lib/money"

/**
 * Consistent price formatter to avoid hydration mismatches.
 * Uses a hardcoded locale (en-NG) to ensure the server and client
 * always render the exact same string.
 */
export function formatPrice(amountInKobo: number): string {
  const amountInNaira = toMajorUnit(amountInKobo)
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amountInNaira)
    .replace("NGN", "₦")
}

/**
 * Exact price formatter — shows kobo (up to 2 decimal places) when present.
 * Use this for fees, earnings, and any value that must match Monnify's figures.
 * e.g. 30.45 → "₦30.45", 2000 → "₦2,000"
 *
 * IMPORTANT: We deliberately avoid style:"currency" + currency:"NGN" here because
 * the en-NG CLDR locale definition treats NGN as a zero-decimal currency and ignores
 * maximumFractionDigits entirely, stripping all kobo. Instead we format as a plain
 * number (which fully respects fraction digits) and manually prepend ₦.
 */
export function formatPriceExact(amountInKobo: number): string {
  // Whole numbers: no decimal places (e.g. ₦2,000)
  // Decimal numbers: always exactly 2 places (e.g. ₦34.50, ₦1,958.55)
  const amountInNaira = toMajorUnit(amountInKobo)
  const hasKobo = !Number.isInteger(amountInNaira)
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amountInNaira)
  return `\u20a6${formatted}`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-NG").format(num)
}

export function formatInputNumber(value: string): string {
  const cleanValue = value.replace(/\D/g, "")
  if (!cleanValue) return ""
  return new Intl.NumberFormat("en-NG").format(parseInt(cleanValue, 10))
}

export function parseInputNumber(value: string): number {
  return parseInt(value.replace(/\D/g, ""), 10) || 0
}

export function formatTime(date: Date | string): string {
  // Handle HH:mm strings (e.g. "10:06") which are not valid full dates
  if (typeof date === "string" && /^\d{1,2}:\d{2}$/.test(date)) {
    const [hours, minutes] = date.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hours12 = hours % 12 || 12
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`
  }

  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export const PREORDER_MIN_HOURS = 2

export function getPrepTimeInHours(value: number, unit: string): number {
  if (unit === "days") return value * 24
  if (unit === "hours") return value
  return value / 60
}

export function formatPrepTime(
  value?: number | null,
  unit?: string | null
): string {
  if (!value || !unit) return ""

  const totalMinutes =
    unit === "days" ? value * 24 * 60 : unit === "hours" ? value * 60 : value

  if (totalMinutes < 60) {
    return `${Math.round(totalMinutes)} mins`
  }

  if (totalMinutes < 24 * 60) {
    const hours = Math.floor(totalMinutes / 60)
    const mins = Math.round(totalMinutes % 60)
    if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`
    return `${hours} hr${hours > 1 ? "s" : ""} ${mins} min${mins > 1 ? "s" : ""}`
  }

  const days = Math.floor(totalMinutes / (24 * 60))
  const remainingHours = Math.floor((totalMinutes % (24 * 60)) / 60)

  if (remainingHours === 0) return `${days} day${days > 1 ? "s" : ""}`
  return `${days} day${days > 1 ? "s" : ""} ${remainingHours} hr${remainingHours > 1 ? "s" : ""}`
}

export function isItemAvailableToday(availableDays?: string[] | null): boolean {
  if (!availableDays || availableDays.length === 0) return true
  const currentDayOfWeek = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Africa/Lagos",
  })
  return availableDays.includes(currentDayOfWeek)
}

export function formatPreorderDeliveryDate(dateString: string | Date): string {
  const date = new Date(dateString)
  const isPast = date.getTime() < Date.now()
  const formatted = date.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
  return `${isPast ? "Delivered on" : "Delivery on"} ${formatted}`
}
