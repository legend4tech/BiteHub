import { z } from "zod"
import { strongPasswordSchema } from "./shared"

export const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})
export type AdminLoginValues = z.infer<typeof adminLoginSchema>

export const adminPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
})

export type AdminPasswordValues = z.infer<typeof adminPasswordSchema>

export const globalSettingsSchema = z.object({
  platformFeePercentage: z
    .number({ message: "Please enter a valid number" })
    .min(0)
    .max(100),
  maintenanceMode: z.boolean(),
})

export type GlobalSettingsValues = z.infer<typeof globalSettingsSchema>

export const adminLandmarkSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  school: z.string().trim().min(1, "School is required"),
  campus: z.string().trim().min(1, "Campus is required"),
  defaultDeliveryFeeInKobo: z
    .number({ message: "Please enter a valid number" })
    .min(0, "Default delivery fee must be a positive number"),
  isActive: z.boolean().optional().default(true),
})

export type AdminLandmarkValues = z.infer<typeof adminLandmarkSchema>

export const adminSubLandmarkSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  landmarkId: z.string().trim().min(1, "Landmark ID is required"),
  defaultDeliveryFeeInKobo: z
    .number({ message: "Please enter a valid number" })
    .min(0)
    .optional(),
  isActive: z.boolean().optional().default(true),
})

export type AdminSubLandmarkValues = z.infer<typeof adminSubLandmarkSchema>

// ─── Staff Management ──────────────────────────────────────────────────────────

/** API schema — uses strongPasswordSchema with .transform() */
export const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: strongPasswordSchema,
  role: z.enum(["vendor_manager", "admin"]),
})
export type CreateStaffValues = z.infer<typeof createStaffSchema>

/** Form schema — plain validation, no transform (compatible with zodResolver) */
export const createStaffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["vendor_manager", "admin"]),
})
export type CreateStaffFormValues = z.infer<typeof createStaffFormSchema>

// ─── Admin / Manager Profile ───────────────────────────────────────────────────

export const updateAdminProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
})
export type UpdateAdminProfileValues = z.infer<typeof updateAdminProfileSchema>

// ─── Platform Withdrawals ──────────────────────────────────────────────────────

export const withdrawalSchema = z.object({
  amountInKobo: z
    .number({ message: "Please enter a valid number" })
    .int("Must be an integer (in Kobo)")
    .positive(),
  reference: z.string().min(1),
  note: z.string().optional(),
})
export type WithdrawalValues = z.infer<typeof withdrawalSchema>

// ─── Analytics ─────────────────────────────────────────────────────────────────

export const analyticsQuerySchema = z.object({
  range: z.enum(["7d", "30d", "1y", "all", "custom"]).default("30d"),
  from: z.string().optional(),
  to: z.string().optional(),
})
export type AnalyticsQueryValues = z.infer<typeof analyticsQuerySchema>
// ─── Vendor Management ─────────────────────────────────────────────────────────

export const adminCreateVendorApiSchema = z.object({
  name: z.string().min(1, "Name is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  email: z.string().email("Invalid email"),
  password: strongPasswordSchema,
  description: z.string().optional().default(""),
  category: z.string().optional().default("general"),
  tags: z.array(z.string()).optional().default([]),
  prepTime: z.string().optional().default(""),
  school: z.string().optional(),
  campus: z.string().optional(),
  image: z.object({ url: z.string().min(1), publicId: z.string() }).optional(),
  isManagedByBiteHub: z.boolean().optional().default(false),
})

export const adminUpdateVendorSchema = z.object({
  isActive: z.boolean().optional(),
  accountIsActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isManagedByBiteHub: z.boolean().optional(),
})

export type AdminCreateVendorApiValues = z.infer<
  typeof adminCreateVendorApiSchema
>
export type AdminUpdateVendorValues = z.infer<typeof adminUpdateVendorSchema>

export const adminVendorAccountSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: strongPasswordSchema,
})

export type AdminVendorAccountValues = z.infer<typeof adminVendorAccountSchema>

// ─── Gamification ─────────────────────────────────────────────────────────────

export const rewardCampaignFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters"),
    description: z.string().trim().optional(),

    actionType: z.enum([
      "REFERRAL_SIGNUP",
      "REFERRAL_FIRST_ORDER",
      "ORDER_COMPLETED",
    ]),
    targetCount: z
      .number({ message: "Please enter a valid number" })
      .min(1, "Target count must be at least 1"),
    minOrderValueInKobo: z
      .number({ message: "Please enter a valid number" })
      .optional(),

    rewardType: z.enum(["BITEHUB_COINS", "FREE_MEAL"]),
    rewardValueInKobo: z
      .number({ message: "Please enter a valid number" })
      .optional(),
    rewardExpiryDays: z
      .number({ message: "Please enter a valid number" })
      .min(1, "Expiry must be at least 1 day")
      .default(90),

    vendorId: z.string().optional(),
    menuItemId: z.string().optional(),

    targetSchool: z.string().optional(),
    targetCampus: z.string().optional(),

    maxBeneficiaries: z
      .number({ message: "Please enter a valid number" })
      .min(1, "Max beneficiaries must be at least 1"),
    budgetAllocatedInKobo: z
      .number({ message: "Please enter a valid number" })
      .min(0, "Budget cannot be negative"),

    isActive: z.boolean().default(true),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()).optional(),

    maxCompletionsPerUser: z
      .number({ message: "Please enter a valid number" })
      .min(0)
      .default(1),
  })
  .superRefine((data, ctx) => {
    if (data.rewardType === "BITEHUB_COINS") {
      if (!data.rewardValueInKobo || data.rewardValueInKobo <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reward value is required for BiteHub Coins",
          path: ["rewardValueInKobo"],
        })
      }
    } else if (data.rewardType === "FREE_MEAL") {
      if (!data.vendorId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a vendor",
          path: ["vendorId"],
        })
      }
      if (!data.menuItemId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a menu item",
          path: ["menuItemId"],
        })
      }
    }
  })

export type RewardCampaignFormValues = z.infer<typeof rewardCampaignFormSchema>

// ─── Gamification Failure Logs ────────────────────────────────────────────────

export const gamificationFailuresQuerySchema = z.object({
  resolved: z.enum(["true", "false"]).optional(),
})
export type GamificationFailuresQueryValues = z.infer<
  typeof gamificationFailuresQuerySchema
>

export const failureLogIdParamSchema = z.object({
  id: z.string().trim().min(1, "Failure log ID is required"),
})
export type FailureLogIdParamValues = z.infer<typeof failureLogIdParamSchema>
