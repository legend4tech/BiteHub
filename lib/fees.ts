/**
 * Monnify fee schedule:
 *   - 1.5% of transaction amount
 *   - 7.5% VAT on the fee itself
 *   - Total Monnify percentage = 0.015 * 1.075 = 0.016125
 *   - Hard cap at ₦2,000 for the base fee (+ ₦150 VAT) = ₦2,150 total
 *
 * FIX — "gross-up" formula:
 *   Let T = base + serviceFee (what customer pays)
 *   Monnify fee + VAT = T × 0.016125
 *   We want: serviceFee = Monnify fee + VAT = T × 0.016125
 *   → T = base + T × 0.016125
 *   → T × (1 - 0.016125) = base
 *   → T = base / 0.983875
 *   → serviceFee = T - base = base × (0.016125 / 0.983875)
 *
 * This means Monnify charges (base + serviceFee) × 1.6125% = exactly serviceFee.
 * The vendor is fully protected — they absorb zero Monnify fee.
 */
export function computeMonnifyServiceFee(base: number): number {
  const fee = base * (0.016125 / 0.983875)

  // Monnify hard cap: fee never exceeds ₦2,150 (215000 Kobo: ₦2000 fee + ₦150 VAT)
  const capped = Math.min(fee, 215000)

  // Round to nearest Kobo (no decimal places)
  return Math.round(capped)
}
