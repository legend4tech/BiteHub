/**
 * Paystack Nigeria fee schedule:
 *   - 1.5% of transaction amount
 *   - + ₦100 flat fee if transaction amount > ₦2,500
 *   - Hard cap at ₦2,000
 *
 * PROBLEM with naive formula (base × 1.5%):
 *   We collect ₦34.50 from the customer (1.5% of ₦2,300 base).
 *   But Paystack charges 1.5% on the TOTAL the customer pays (₦2,334.50),
 *   so Paystack actually takes ₦35.02. The missing ₦0.52 comes from the vendor.
 *
 * FIX — "gross-up" formula:
 *   Let T = base + serviceFee (what customer pays)
 *   Paystack fee = T × 0.015   (ignoring flat fee for now)
 *   We want: serviceFee = Paystack fee = T × 0.015
 *   → T = base + T × 0.015
 *   → T × (1 - 0.015) = base
 *   → T = base / 0.985
 *   → serviceFee = T - base = base × (0.015 / 0.985)
 *
 * This means Paystack charges (base + serviceFee) × 1.5% = exactly serviceFee.
 * The vendor is fully protected — they absorb zero Paystack fee.
 */
export function computePaystackServiceFee(base: number): number {
  // Step 1: estimate assuming no flat fee applies
  const feeNoFlat = (base * 0.015) / 0.985
  const estimatedTotal = base + feeNoFlat

  let fee: number
  if (estimatedTotal > 2500) {
    // Flat fee of ₦100 applies — recalculate with it included in the gross-up
    fee = (base * 0.015 + 100) / 0.985
  } else {
    fee = feeNoFlat
  }

  // Paystack hard cap: fee never exceeds ₦2,000
  const capped = Math.min(fee, 2000)

  // Round to the nearest kobo (2 decimal places).
  // This ensures finalTotal = base + serviceFee is always a clean kobo amount,
  // so Paystack receives an exact integer in kobo — no truncation, no 1-kobo drift.
  return Math.round(capped * 100) / 100
}
