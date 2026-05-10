import { z } from "zod";

// ─── Phone Number Helpers ─────────────────────────────────────────────────────

/**
 * Normalise a Nigerian phone number to international +234 format.
 * Accepts:  08012345678, 8012345678, 2348012345678, +2348012345678
 * Returns:  +2348012345678  (always 14 chars)
 */
export function normaliseNigerianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  // Already has country code → just prepend "+"
  if (digits.startsWith("234") && digits.length === 13) return `+${digits}`;

  // Local format starting with 0
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;

  // 10-digit bare local (no leading 0) e.g. 8012345678
  if (/^[789]\d{9}$/.test(digits)) return `+234${digits}`;

  // Return as-is if we can't normalise (validation will catch it)
  return raw;
}

// ─── Order Form Schema ────────────────────────────────────────────────────────

/** Input schema — no transforms, safe for react-hook-form + zodResolver */
export const orderFormInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .refine(
      (v) => /^\+234[789]\d{9}$/.test(normaliseNigerianPhone(v)),
      "Enter a valid Nigerian phone number (e.g. 08012345678)."
    ),
  notes: z.string().trim().optional(),
});

export type OrderFormInputValues = z.infer<typeof orderFormInputSchema>;

/** Full schema with phone normalisation — use for final data processing */
export const orderFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .min(2, "Name must be at least 2 characters."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .transform(normaliseNigerianPhone)
    .refine(
      (v) => /^\+234[789]\d{9}$/.test(v),
      "Enter a valid Nigerian phone number (e.g. 08012345678)."
    ),
  notes: z.string().trim().optional(),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

// ─── Menu Item Form Schema ────────────────────────────────────────────────────

export const menuItemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required.")
    .min(2, "Name must be at least 2 characters."),
  description: z.string().trim().optional(),
  price: z
    .string()
    .min(1, "Price is required.")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid price."),
  category: z.enum(["rice", "soup", "snack", "drink", "protein", "shawarma", "food"]),
  isAvailable: z.boolean(),
  image: z.string().trim().optional(),
});

export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

// ─── Vendor Login Schema ──────────────────────────────────────────────────────

export const vendorLoginSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Phone number or ID is required."),
  password: z
    .string()
    .min(1, "Password is required."),
});

export type VendorLoginValues = z.infer<typeof vendorLoginSchema>;
