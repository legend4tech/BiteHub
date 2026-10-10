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
  const secret = process.env.NEXTAUTH_SECRET || "fallback-secret"
  return createHmac("sha256", secret).update(email).digest("hex")
}
