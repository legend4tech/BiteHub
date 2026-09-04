import { z } from "zod"
import { strongPasswordSchema } from "./shared"

export const addLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: strongPasswordSchema,
})
export type AddLoginValues = z.infer<typeof addLoginSchema>

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

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: strongPasswordSchema,
})
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
