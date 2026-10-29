import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}

import { createHmac } from "crypto"

export function generateUnsubscribeToken(email: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error(
      "AUTH_SECRET or NEXTAUTH_SECRET must be configured to generate tokens"
    )
  }
  return createHmac("sha256", secret)
    .update(email.toLowerCase().trim())
    .digest("hex")
}
