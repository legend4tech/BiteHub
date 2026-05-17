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

export function formatInputNumber(value: string): string {
  const cleanValue = value.replace(/\D/g, "");
  if (!cleanValue) return "";
  return new Intl.NumberFormat("en-NG").format(parseInt(cleanValue, 10));
}

export function parseInputNumber(value: string): number {
  return parseInt(value.replace(/\D/g, ""), 10) || 0;
}

export function formatTime(date: Date | string): string {
  // Handle HH:mm strings (e.g. "10:06") which are not valid full dates
  if (typeof date === "string" && /^\d{1,2}:\d{2}$/.test(date)) {
    const [hours, minutes] = date.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  }

  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
