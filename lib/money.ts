import { dinero, toDecimal } from "dinero.js"

// Define NGN currency object for Dinero v2
const NGN = {
  code: "NGN",
  base: 10,
  exponent: 2,
}

/**
 * Creates a Dinero object from an amount in Kobo.
 */
export function createMoneyFromKobo(amountInKobo: number) {
  const safeAmount = Number(amountInKobo) || 0
  return dinero({ amount: Math.round(safeAmount), currency: NGN })
}

/**
 * Converts a raw Kobo integer to a human-readable Naira string (e.g., ₦1,050.50).
 */
export function formatKoboToNaira(amountInKobo: number): string {
  const d = createMoneyFromKobo(amountInKobo)
  const decimalValue = Number(toDecimal(d))

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(decimalValue)
}

/**
 * Converts a raw Naira number (e.g., from a user input form) to a safe integer in Kobo.
 */
export function nairaToKobo(amountInNaira: number): number {
  return Math.round(amountInNaira * 100)
}

/**
 * Converts a raw Kobo integer to a major unit float (e.g. Naira or BHC).
 * Uses dinero.js to ensure consistent scaling based on currency exponent.
 */
export function toMajorUnit(amountInKobo: number): number {
  const d = createMoneyFromKobo(amountInKobo)
  return Number(toDecimal(d))
}
