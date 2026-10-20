/**
 * @fileoverview Cryptographic token utilities for BiteHub onboarding and authentication.
 * Uses native Node crypto for zero-dependency, constant-time HMAC signatures.
 */

import crypto from "crypto"

export interface GoogleSignupTokenPayload {
  purpose: "google_signup"
  jti: string
  email: string
  name: string
  image: string
  referredBy?: string
  exp: number
}

const TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is missing")
  }
  return secret
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/")
  while (base64.length % 4) {
    base64 += "="
  }
  return Buffer.from(base64, "base64").toString()
}

/**
 * Signs an ephemeral onboarding token for Google signups (15-minute validity).
 */
export function signGoogleSignupToken(payload: {
  email: string
  name: string
  image: string
  referredBy?: string
}): string {
  const fullPayload: GoogleSignupTokenPayload = {
    purpose: "google_signup",
    jti: crypto.randomUUID(),
    email: payload.email.toLowerCase().trim(),
    name: payload.name.trim(),
    image: payload.image.trim(),
    referredBy: payload.referredBy?.trim() || undefined,
    exp: Date.now() + TOKEN_TTL_MS,
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("hex")

  return `${encodedPayload}.${signature}`
}

/**
 * Verifies an ephemeral onboarding token, returning the payload if valid and not expired.
 * Uses constant-time equality check to prevent timing attacks.
 */
export function verifyGoogleSignupToken(
  token: string
): GoogleSignupTokenPayload | null {
  try {
    if (!token || typeof token !== "string" || !token.includes(".")) {
      return null
    }

    const [encodedPayload, signature] = token.split(".")
    if (!encodedPayload || !signature) {
      return null
    }

    const expectedSignature = crypto
      .createHmac("sha256", getSecret())
      .update(encodedPayload)
      .digest("hex")

    const sigBuffer = Buffer.from(signature, "hex")
    const expectedBuffer = Buffer.from(expectedSignature, "hex")

    if (sigBuffer.length !== expectedBuffer.length) {
      return null
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null
    }

    const payloadJson = base64UrlDecode(encodedPayload)
    const payload = JSON.parse(payloadJson) as GoogleSignupTokenPayload

    if (payload.purpose !== "google_signup" || !payload.email || !payload.exp) {
      return null
    }

    if (payload.exp < Date.now()) {
      return null // Expired
    }

    return payload
  } catch (error) {
    console.error("[verifyGoogleSignupToken] Failed to verify token:", error)
    return null
  }
}
