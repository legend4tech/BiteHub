import { z } from "zod"
import {
  phoneInputSchema,
  strongPasswordSchema,
  normaliseNigerianPhone,
} from "./shared"

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
  paymentMethod: z.enum(["monnify", "wallet"]).default("monnify"),
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
  paymentMethod: z.enum(["monnify", "wallet"]).default("monnify"),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>

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
  customerEmail: z.string().trim().email("Valid email is required"),
  customerPhone: z.string().min(1, "Customer phone is required"),
  location: z.string().min(1, "Location is required"),
  exactLocation: z.string().min(1, "Exact location is required"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["monnify", "wallet"]).default("monnify"),
  total: z.number().optional(), // We accept it but ignore it for calculation
})
export type CreateOrderValues = z.infer<typeof createOrderSchema>

// ─── Customer Schemas ─────────────────────────────────────────────────────────

/** Form schema — no .transform() so zodResolver works correctly */
export const customerSignupFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address.")
      .toLowerCase(),
    phone: phoneInputSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    school: z.string().trim().min(1, "Please select your school."),
    campus: z.string().trim().min(1, "Please select your campus."),
    referredBy: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type CustomerSignupFormValues = z.infer<typeof customerSignupFormSchema>

/** API schema — with phone normalisation, use in route handlers only */
export const customerSignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .toLowerCase(),
  phone: phoneInputSchema.transform(normaliseNigerianPhone),
  password: strongPasswordSchema,
  school: z.string().trim().min(1, "Please select your school."),
  campus: z.string().trim().min(1, "Please select your campus."),
  referredBy: z.string().trim().optional(),
})
export type CustomerSignupValues = z.infer<typeof customerSignupSchema>

export const customerLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(1, "Password is required"),
})
export type CustomerLoginValues = z.infer<typeof customerLoginSchema>

export const customerProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .optional(),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .transform(normaliseNigerianPhone)
    .refine(
      (v) => /^\+234[789]\d{9}$/.test(v),
      "Enter a valid Nigerian phone number (e.g. 08012345678)."
    )
    .optional(),
  school: z.string().trim().min(1, "School is required.").optional(),
  campus: z.string().trim().min(1, "Campus is required.").optional(),
  preferredLandmark: z.string().trim().optional(),
  preferredSubLandmark: z.string().trim().optional(),
  preferredExactLocation: z.string().trim().optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  imagePublicId: z.string().optional().or(z.literal("")),
})
export type CustomerProfileUpdateValues = z.infer<
  typeof customerProfileUpdateSchema
>

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const walletActivationSchema = z.object({
  nin: z
    .string()
    .trim()
    .length(11, "A valid 11-digit NIN is required to activate your wallet."),
})
export type WalletActivationValues = z.infer<typeof walletActivationSchema>
