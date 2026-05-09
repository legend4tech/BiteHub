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
  }).format(amount).replace("NGN", "₦");
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-NG").format(num);
}
