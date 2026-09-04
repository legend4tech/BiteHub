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
  platformFeePercentage: z.number().min(0).max(100),
  maintenanceMode: z.boolean(),
})

export type GlobalSettingsValues = z.infer<typeof globalSettingsSchema>

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
