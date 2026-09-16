import { z } from "zod"

export const strongPasswordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character")

export function normaliseNigerianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("234") && digits.length === 13) return `+${digits}`
  if (digits.startsWith("0") && digits.length === 11)
    return `+234${digits.slice(1)}`
  if (/^[789]\d{9}$/.test(digits)) return `+234${digits}`
  return raw
}

export function formatToWhatsapp(raw: string): string {
  if (!raw) return ""
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("0") && digits.length === 11) {
    return "234" + digits.slice(1)
  }
  if (digits.startsWith("234") && digits.length === 13) {
    return digits
  }
  return raw
}

export function formatFromWhatsapp(raw: string): string {
  if (!raw) return ""
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("234") && digits.length === 13) {
    return "0" + digits.slice(3)
  }
  return raw
}

export const phoneInputSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .regex(
    /^0\d{10}$/,
    "Must be exactly 11 digits starting with 0 (e.g. 08012345678)"
  )

export const whatsappInputSchema = phoneInputSchema

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(3, "Message is required"),
})
export type ContactValues = z.infer<typeof contactSchema>

export const orderPaymentStatusSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "failed"], {
    message: "Invalid payment status",
  }),
})

export type OrderPaymentStatusValues = z.infer<typeof orderPaymentStatusSchema>

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

export const getLandmarksQuerySchema = z.object({
  school: z.string().min(1, "School is required"),
  campus: z.string().min(1, "Campus is required"),
})
export type GetLandmarksQueryValues = z.infer<typeof getLandmarksQuerySchema>
