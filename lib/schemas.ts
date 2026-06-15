import { z } from "zod"

// ─── Shared Schemas ───────────────────────────────────────────────────────────

export const strongPasswordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character")

// ─── Phone Number Helpers ─────────────────────────────────────────────────────

/**
 * Normalise a Nigerian phone number to international +234 format.
 * Accepts:  08012345678, 8012345678, 2348012345678, +2348012345678
 * Returns:  +2348012345678  (always 14 chars)
 */
export function normaliseNigerianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")

  // Already has country code → just prepend "+"
  if (digits.startsWith("234") && digits.length === 13) return `+${digits}`

  // Local format starting with 0
  if (digits.startsWith("0") && digits.length === 11)
    return `+234${digits.slice(1)}`

  // 10-digit bare local (no leading 0) e.g. 8012345678
  if (/^[789]\d{9}$/.test(digits)) return `+234${digits}`

  // Return as-is if we can't normalise (validation will catch it)
  return raw
}

/**
 * Transforms an 11-digit local WhatsApp number (080...) to 13-digit DB format (234...)
 */
export function formatToWhatsapp(raw: string): string {
  if (!raw) return ""
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("0") && digits.length === 11) {
    return "234" + digits.slice(1)
  }
  // already formatted?
  if (digits.startsWith("234") && digits.length === 13) {
    return digits
  }
  return raw
}

/**
 * Transforms a 13-digit DB WhatsApp number (234...) back to 11-digit local format (080...)
 */
export function formatFromWhatsapp(raw: string): string {
  if (!raw) return ""
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("234") && digits.length === 13) {
    return "0" + digits.slice(3)
  }
  return raw
}

export const whatsappInputSchema = z
  .string()
  .trim()
  .min(1, "WhatsApp number is required.")
  .regex(
    /^0\d{10}$/,
    "Must be exactly 11 digits starting with 0 (e.g. 08012345678)"
  )

// ─── Order Form Schema ────────────────────────────────────────────────────────

/** Input schema — no transforms, safe for react-hook-form + zodResolver */
export const orderFormInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email.")
    .email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .refine(
      (v) => /^\+234[789]\d{9}$/.test(normaliseNigerianPhone(v)),
      "Enter a valid Nigerian phone number (e.g. 08012345678)."
    ),
  location: z.string().trim().min(1, "Please select the nearest landmark."),
  exactLocation: z
    .string()
    .trim()
    .min(1, "Please enter your exact location or lodge name."),
  notes: z.string().trim().optional(),
  paymentMethod: z.enum(["monnify"]).default("monnify"),
})

export type OrderFormInputValues = z.infer<typeof orderFormInputSchema>

/** Full schema with phone normalisation — use for final data processing */
export const orderFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .min(2, "Name must be at least 2 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email.")
    .email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number.")
    .transform(normaliseNigerianPhone)
    .refine(
      (v) => /^\+234[789]\d{9}$/.test(v),
      "Enter a valid Nigerian phone number (e.g. 08012345678)."
    ),
  location: z.string().trim().min(1, "Please select the nearest landmark."),
  exactLocation: z
    .string()
    .trim()
    .min(1, "Please enter your exact location or lodge name."),
  notes: z.string().trim().optional(),
  paymentMethod: z.enum(["monnify"]).default("monnify"),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>

// ─── Menu Item Form Schema ────────────────────────────────────────────────────

export const menuItemFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Item name is required.")
      .min(2, "Name must be at least 2 characters."),
    description: z.string().trim().optional(),
    price: z
      .string()
      .min(1, "Price is required.")
      .refine((v) => {
        const cleanValue = v.replace(/,/g, "")
        return !isNaN(Number(cleanValue)) && Number(cleanValue) > 0
      }, "Enter a valid price."),
    category: z.enum([
      "rice",
      "soup",
      "snack",
      "drink",
      "protein",
      "shawarma",
      "food",
    ]),
    isAvailable: z.boolean(),
    image: z.any().nullable().optional(),
    availableFrom: z.string().optional(),
    availableTo: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.availableFrom && !data.availableTo) return false
      if (!data.availableFrom && data.availableTo) return false
      if (data.availableFrom && data.availableTo) {
        return data.availableFrom < data.availableTo
      }
      return true
    },
    {
      message:
        "Both start and end time must be specified, and start time must be before end time.",
      path: ["availableFrom"],
    }
  )

export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>

export const vendorSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  whatsappNumber: whatsappInputSchema,
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  prepTime: z.string().min(1, "Estimated prep time is required"),
  school: z.string().optional(),
  campus: z.string().optional(),
  image: z.any().nullable().optional(),
})

export type VendorSettingsValues = z.infer<typeof vendorSettingsSchema>

export const vendorPaymentSettingsSchema = z.object({
  accountNumber: z
    .string()
    .length(10, "Account number must be 10 digits")
    .optional(),
  bankCode: z.string().min(1, "Bank is required").optional(),
})

export type VendorPaymentSettingsValues = z.infer<
  typeof vendorPaymentSettingsSchema
>

export const vendorUpdateSchema = vendorSettingsSchema
  .merge(vendorPaymentSettingsSchema)
  .partial()

// ─── Vendor Login Schema ──────────────────────────────────────────────────────

export const vendorLoginSchema = z.object({
  phone: z.string().trim().min(1, "Phone number or ID is required."),
  password: z.string().min(1, "Password is required."),
})

export type VendorLoginValues = z.infer<typeof vendorLoginSchema>

// ─── Order Payment Status Schema ──────────────────────────────────────────────

export const orderPaymentStatusSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "failed"], {
    message: "Invalid payment status",
  }),
})

export type OrderPaymentStatusValues = z.infer<typeof orderPaymentStatusSchema>

// ─── Admin Password Schema ────────────────────────────────────────────────────

/**
 * Base schema (no cross-field refine) — used for zodResolver so the input type
 * matches FieldValues. Cross-field password match validation is done via setError
 * in the submit handler, per the react-hook-form + Zod v4 recommended pattern.
 */
export const adminPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
})

export type AdminPasswordValues = z.infer<typeof adminPasswordSchema>

// ─── Global Settings Schema ───────────────────────────────────────────────────

export const globalSettingsSchema = z.object({
  platformFeePercentage: z.number().min(0).max(100),
  maintenanceMode: z.boolean(),
})

export type GlobalSettingsValues = z.infer<typeof globalSettingsSchema>

// ─── Delivery Settings & Zones Schemas ────────────────────────────────────────

export const vendorDeliverySettingsUpdateSchema = z.object({
  landmarkOverrides: z
    .array(
      z.object({
        landmarkId: z.string().min(1, "Landmark ID is required"),
        fee: z.number().min(0, "Fee must be a positive number"),
      })
    )
    .optional(),
  subLandmarkOverrides: z
    .array(
      z.object({
        subLandmarkId: z.string().min(1, "Sub-landmark ID is required"),
        fee: z.number().min(0, "Fee must be a positive number"),
      })
    )
    .optional(),
})

export type VendorDeliverySettingsUpdateValues = z.infer<
  typeof vendorDeliverySettingsUpdateSchema
>

export const adminLandmarkSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  school: z.string().trim().min(1, "School is required"),
  campus: z.string().trim().min(1, "Campus is required"),
  defaultDeliveryFee: z
    .number()
    .min(0, "Default delivery fee must be a positive number"),
  isActive: z.boolean().optional().default(true),
})

export type AdminLandmarkValues = z.infer<typeof adminLandmarkSchema>

export const adminSubLandmarkSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  landmarkId: z.string().trim().min(1, "Landmark ID is required"),
  defaultDeliveryFee: z.number().min(0).optional(),
  isActive: z.boolean().optional().default(true),
})

export type AdminSubLandmarkValues = z.infer<typeof adminSubLandmarkSchema>
