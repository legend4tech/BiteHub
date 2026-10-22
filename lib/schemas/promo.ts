import { z } from "zod"
import { nairaToKobo } from "@/lib/money"

export const validatePromoCodeInputSchema = z.object({
  code: z
    .string()
    .min(1, "Promo code is required")
    .max(30, "Promo code is too long")
    .transform((val) => val.trim().toUpperCase()),
  vendorId: z.string().min(1, "Vendor ID is required"),
  campus: z.string().optional(),
  school: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        priceInKobo: z.number().int().min(0),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "Cart must have at least one item"),
})

export type ValidatePromoCodeInput = z.infer<
  typeof validatePromoCodeInputSchema
>

/**
 * Form schema for admin UI input (pure Naira, no .transform for zodResolver)
 */
export const promoCodeFormInputSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code cannot exceed 20 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Code can only contain letters, numbers, hyphens, and underscores"
    ),
  title: z.string().min(2, "Title is required").max(100),
  description: z.string().max(255).optional().nullable(),

  targetSchool: z.string().optional().nullable(),
  targetCampus: z.string().optional().nullable(),
  targetVendorId: z.string().optional().nullable(),
  targetMenuItemId: z.string().optional().nullable(),

  discountType: z.enum(["FIXED_AMOUNT", "PERCENTAGE"]),
  discountInNaira: z
    .number({ message: "Discount in Naira must be a number" })
    .min(0, "Discount cannot be negative"),
  discountPercentage: z.number().int().min(1).max(100).optional().nullable(),
  maxDiscountInNaira: z.number().min(0).optional().nullable().nullable(),
  minOrderValueInNaira: z.number().min(0).optional().nullable().nullable(),

  budgetInNaira: z
    .number({ message: "Budget in Naira must be a number" })
    .min(10, "Budget must be at least ₦10"),
  maxRedemptions: z.number().int().min(1).optional().nullable(),
  maxRedemptionsPerCustomer: z.number().int().min(1).default(1),

  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
})

export type PromoCodeFormInputValues = z.infer<typeof promoCodeFormInputSchema>

/**
 * API validation schema: Accepts Naira inputs (or direct Kobo) and converts
 * to integer Kobo using the centralized nairaToKobo helper.
 */
export const createPromoCodeSchema = z
  .object({
    code: z
      .string()
      .min(2, "Code must be at least 2 characters")
      .max(20, "Code cannot exceed 20 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Code can only contain letters, numbers, hyphens, and underscores"
      )
      .transform((v) => v.toUpperCase().trim()),
    title: z.string().min(2, "Title is required").max(100),
    description: z.string().max(255).optional().nullable(),

    targetSchool: z.string().optional().nullable(),
    targetCampus: z.string().optional().nullable(),
    targetVendorId: z.string().optional().nullable(),
    targetMenuItemId: z.string().optional().nullable(),

    discountType: z.enum(["FIXED_AMOUNT", "PERCENTAGE"]),
    // Accepts either human Naira or direct Kobo
    discountInNaira: z.number().min(0).optional(),
    discountValueInKobo: z.number().int().min(0).optional(),

    discountPercentage: z.number().int().min(1).max(100).optional().nullable(),
    maxDiscountInNaira: z.number().min(0).optional().nullable(),
    maxDiscountInKobo: z.number().int().min(0).optional().nullable(),

    minOrderValueInNaira: z.number().min(0).optional().nullable(),
    minOrderValueInKobo: z.number().int().min(0).optional().nullable(),

    // Accepts either human Naira or direct Kobo
    budgetInNaira: z.number().min(10, "Budget must be at least ₦10").optional(),
    budgetAllocatedInKobo: z.number().int().min(1000).optional(),

    maxRedemptions: z.number().int().min(1).optional().nullable(),
    maxRedemptionsPerCustomer: z.number().int().min(1).default(1),

    startDate: z.coerce.date().default(() => new Date()),
    endDate: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.budgetInNaira !== undefined ||
      data.budgetAllocatedInKobo !== undefined,
    {
      message:
        "Budget is required (provide budgetInNaira or budgetAllocatedInKobo)",
      path: ["budgetInNaira"],
    }
  )
  .transform((data) => {
    const budgetAllocatedInKobo =
      data.budgetAllocatedInKobo !== undefined
        ? data.budgetAllocatedInKobo
        : nairaToKobo(data.budgetInNaira ?? 0)

    const discountValueInKobo =
      data.discountValueInKobo !== undefined
        ? data.discountValueInKobo
        : nairaToKobo(data.discountInNaira ?? 0)

    const maxDiscountInKobo =
      data.maxDiscountInKobo !== undefined
        ? data.maxDiscountInKobo
        : data.maxDiscountInNaira !== undefined &&
            data.maxDiscountInNaira !== null
          ? nairaToKobo(data.maxDiscountInNaira)
          : null

    const minOrderValueInKobo =
      data.minOrderValueInKobo !== undefined
        ? data.minOrderValueInKobo
        : data.minOrderValueInNaira !== undefined &&
            data.minOrderValueInNaira !== null
          ? nairaToKobo(data.minOrderValueInNaira)
          : null

    return {
      code: data.code,
      title: data.title,
      description: data.description ?? null,
      targetSchool: data.targetSchool ?? null,
      targetCampus: data.targetCampus ?? null,
      targetVendorId: data.targetVendorId ?? null,
      targetMenuItemId: data.targetMenuItemId ?? null,
      discountType: data.discountType,
      discountValueInKobo,
      discountPercentage: data.discountPercentage ?? null,
      maxDiscountInKobo,
      minOrderValueInKobo,
      budgetAllocatedInKobo,
      maxRedemptions: data.maxRedemptions ?? null,
      maxRedemptionsPerCustomer: data.maxRedemptionsPerCustomer,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      isActive: data.isActive,
    }
  })

export type CreatePromoCodeValues = z.infer<typeof createPromoCodeSchema>
