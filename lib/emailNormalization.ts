/**
 * emailNormalization.ts
 *
 * Single source of truth for email canonicalization and disposable domain checks.
 * Stops email aliasing abuse (Gmail dot-trick, plus-addressing, googlemail aliases).
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "throwawaymail.com",
  "temp-mail.org",
  "trashmail.com",
  "yopmail.com",
  "getnada.com",
  "dispostable.com",
])

/**
 * Normalises an email address to its canonical form to prevent multi-account/referral abuse.
 *
 * Rules:
 * - Trims whitespace and lowercases the address.
 * - For Gmail/Googlemail:
 *   - Strips all dots in the username (e.g. `l.e.g.e.n.d4tech` -> `legend4tech`)
 *   - Strips plus-addressing tags (e.g. `legend4tech+food` -> `legend4tech`)
 *   - Normalises `@googlemail.com` to `@gmail.com`
 * - For Outlook/Hotmail/Live/iCloud:
 *   - Strips plus-addressing tags (e.g. `user+tag` -> `user`)
 * - For Yahoo:
 *   - Strips hyphen-addressing tags (e.g. `user-tag` -> `user`)
 */
export function getCanonicalEmail(rawEmail: string): string {
  if (!rawEmail || typeof rawEmail !== "string") {
    return ""
  }

  const trimmed = rawEmail.trim().toLowerCase()
  const atIndex = trimmed.lastIndexOf("@")

  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    return trimmed
  }

  const localPart = trimmed.slice(0, atIndex)
  let domain = trimmed.slice(atIndex + 1)

  // Normalise googlemail.com -> gmail.com
  if (domain === "googlemail.com") {
    domain = "gmail.com"
  }

  let cleanLocal = localPart

  if (domain === "gmail.com") {
    // Gmail ignores dots entirely
    cleanLocal = cleanLocal.replace(/\./g, "")
    // Gmail ignores anything after '+'
    cleanLocal = cleanLocal.split("+")[0]
  } else if (
    domain === "outlook.com" ||
    domain === "hotmail.com" ||
    domain === "live.com" ||
    domain === "icloud.com"
  ) {
    // Microsoft and Apple ignore anything after '+'
    cleanLocal = cleanLocal.split("+")[0]
  } else if (domain === "yahoo.com") {
    // Yahoo uses '-' for disposable addresses
    cleanLocal = cleanLocal.split("-")[0]
  } else {
    // Standard RFC 5233 subaddressing for other domains
    if (cleanLocal.includes("+")) {
      cleanLocal = cleanLocal.split("+")[0]
    }
  }

  return `${cleanLocal}@${domain}`
}

/**
 * Checks whether an email belongs to a known temporary/disposable email provider.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  const atIndex = email.lastIndexOf("@")
  if (atIndex === -1) return false
  const domain = email
    .slice(atIndex + 1)
    .toLowerCase()
    .trim()
  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}
