/**
 * Consistent price formatter to avoid hydration mismatches.
 * Uses a hardcoded locale (en-NG) to ensure the server and client
 * always render the exact same string.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
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
export function formatPriceExact(amount: number): string {
  // Whole numbers: no decimal places (e.g. ₦2,000)
  // Decimal numbers: always exactly 2 places (e.g. ₦34.50, ₦1,958.55)
  const hasKobo = !Number.isInteger(amount)
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
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
