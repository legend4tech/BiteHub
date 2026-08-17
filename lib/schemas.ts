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
    image: z.any().refine((val) => val != null, "An image is required."),
    availableFrom: z.string().optional(),
    availableTo: z.string().optional(),
    prepTimeValue: z.string().optional(),
    prepTimeUnit: z.enum(["minutes", "hours", "days"]).optional(),
    quantityAvailable: z.string().optional(),
    availableDays: z
      .array(z.string())
      .default([
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ]),
    isPreorder: z.boolean().default(false),
    preorderEndDate: z.string().optional(),
    preorderDeliveryInfo: z
      .string()
      .max(100, "Keep delivery info under 100 characters")
      .optional(),
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
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
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

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(3, "Message is required"),
})
export type ContactValues = z.infer<typeof contactSchema>

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
})
export type OrderItemValues = z.infer<typeof orderItemSchema>

export const createOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorWhatsappNumber: z.string().optional(),
  vendorPhone: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(1, "Customer phone is required"),
  location: z.string().min(1, "Location is required"),
  exactLocation: z.string().min(1, "Exact location is required"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["monnify"]).default("monnify"),
  total: z.number().optional(), // We accept it but ignore it for calculation
})
export type CreateOrderValues = z.infer<typeof createOrderSchema>

export const addLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: strongPasswordSchema,
})
export type AddLoginValues = z.infer<typeof addLoginSchema>

export const quickAddVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  email: z.string().email("Invalid email"),
  password: strongPasswordSchema,
  image: z
    .object({ url: z.string().min(1), publicId: z.string().min(1) })
    .optional()
    .refine((val) => !!val, { message: "Image is required" }),
})
export type QuickAddVendorValues = z.infer<typeof quickAddVendorSchema>

export const vendorCreationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  whatsappNumber: whatsappInputSchema,
  email: z.string().email("Invalid email"),
  password: strongPasswordSchema,
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  prepTime: z.string().optional(),
  school: z.string().min(1, "School is required"),
  campus: z.string().min(1, "Campus is required"),
  image: z
    .object({
      url: z.string().min(1, "Image is required"),
      publicId: z.string(),
      file: z.instanceof(File).optional(),
    })
    .nullable()
    .optional()
    .refine((val) => val !== null && val !== undefined && val.url.length > 0, {
      message: "Image is required",
    }),
})
export type VendorCreationValues = z.infer<typeof vendorCreationSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase(),
})
export type ChangeEmailValues = z.infer<typeof changeEmailSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})
export type AdminLoginValues = z.infer<typeof adminLoginSchema>

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: strongPasswordSchema,
})
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export const statusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "completed",
    "cancelled",
  ]),
})
export type StatusUpdateValues = z.infer<typeof statusUpdateSchema>

export const vendorsPublicQuerySchema = z.object({
  school: z.string().optional(),
  campus: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})
export type VendorsPublicQueryValues = z.infer<typeof vendorsPublicQuerySchema>
