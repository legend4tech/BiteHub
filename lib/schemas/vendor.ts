import { z } from "zod"
import { whatsappInputSchema, strongPasswordSchema } from "./shared"

// ─── Menu Item Form Schema ────────────────────────────────────────────────────

export const menuItemFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Item name is required.")
      .min(2, "Name must be at least 2 characters."),
    description: z.string().trim().optional(),
    priceInKobo: z
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

export type SanitizedMenuItemUpdate = Omit<
  Partial<MenuItemFormValues>,
  "priceInKobo" | "quantityAvailable" | "prepTimeValue"
> & {
  priceInKobo?: number
  quantityAvailable?: number | null
  prepTimeValue?: number | null
  vendorId?: string
  computedIsAvailableNow?: boolean
  lowStockAlertSent?: boolean
}

export const vendorSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  whatsappNumber: whatsappInputSchema,
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  prepTime: z.string().min(1, "Estimated prep time is required"),
  school: z.string().optional(),
  campus: z.string().optional(),
  isOpen: z.boolean().optional(),
  receivesMarketing: z.boolean().optional().default(true),
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

export const monnifySubaccountRequestSchema = z.object({
  accountNumber: z.string().min(1, "Account number is required"),
  bankCode: z.string().min(1, "Bank code is required"),
  bankName: z.string().optional(),
})

export type MonnifySubaccountRequestValues = z.infer<
  typeof monnifySubaccountRequestSchema
>

// ─── Vendor Login Schema ──────────────────────────────────────────────────────

export const vendorLoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type VendorLoginValues = z.infer<typeof vendorLoginSchema>

export const vendorDeliverySettingsUpdateSchema = z.object({
  landmarkOverrides: z
    .array(
      z.object({
        landmarkId: z.string().min(1, "Landmark ID is required"),
        feeInKobo: z
          .number({ message: "Please enter a valid number" })
          .min(0, "Fee must be a positive number"),
      })
    )
    .optional(),
  subLandmarkOverrides: z
    .array(
      z.object({
        subLandmarkId: z.string().min(1, "Sub-landmark ID is required"),
        feeInKobo: z
          .number({ message: "Please enter a valid number" })
          .min(0, "Fee must be a positive number"),
      })
    )
    .optional(),
})

export type VendorDeliverySettingsUpdateValues = z.infer<
  typeof vendorDeliverySettingsUpdateSchema
>

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
  isManagedByBiteHub: z.boolean().optional().default(false),
})
export type VendorCreationValues = z.infer<typeof vendorCreationSchema>

export const vendorsPublicQuerySchema = z.object({
  school: z.string().optional(),
  campus: z.string().optional(),
  page: z.coerce
    .number({ message: "Please enter a valid number" })
    .int()
    .positive()
    .optional()
    .default(1),
  limit: z.coerce
    .number({ message: "Please enter a valid number" })
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20),
})
export type VendorsPublicQueryValues = z.infer<typeof vendorsPublicQuerySchema>

export const monnifyBankVerifySchema = z.object({
  accountNumber: z.string().min(1, "Account number is required"),
  bankCode: z.string().min(1, "Bank code is required"),
  bankName: z.string().optional(),
  otp: z.string().min(1, "OTP is required"),
})
export type MonnifyBankVerifyValues = z.infer<typeof monnifyBankVerifySchema>
