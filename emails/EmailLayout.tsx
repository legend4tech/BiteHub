/**
 * EmailLayout.tsx
 *
 * Shared wrapper for every BiteHub email template.
 * All brand values (logo, tagline, URLs, contact) are sourced from
 * lib/constants.ts — change them once and every template updates.
 *
 * Usage:
 *   <EmailLayout preview="Reset your password" subheader="Vendor Account">
 *     Your unique content here
 *   </EmailLayout>
 */

import {
  Body,
  Container,
  Head,
  Html,
  Hr,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Heading,
} from "@react-email/components"
import * as React from "react"
import {
  APP_NAME,
  APP_TAGLINE,
  APP_BASE_URL,
  APP_LOGO_EMAIL_URL,
  CONTACT_EMAIL,
} from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"

interface EmailLayoutProps {
  /** Text shown in the inbox preview snippet */
  preview: string
  /** Small uppercase badge shown below the BiteHub wordmark */
  subheader: string
  /** Optional note displayed above the footer links. Defaults to a 'no-reply' message. Pass null to hide. */
  footerNote?: React.ReactNode
  children: React.ReactNode
}

export function EmailLayout({
  preview,
  subheader,
  footerNote = "This is an automated message. Please do not reply to this email.",
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ── Header ──────────────────────────────────────── */}
          <Section style={headerSection}>
            <Img
              src={APP_LOGO_EMAIL_URL}
              alt={APP_NAME}
              width="48"
              height="48"
              style={logoImg}
            />
            <Heading style={logoText}>
              Bite<span style={logoHighlight}>Hub</span>
            </Heading>
            <Text style={subHeaderStyle}>{subheader}</Text>
          </Section>

          <Hr style={divider} />

          {/* ── Content slot ────────────────────────────────── */}
          <Section style={contentSection}>{children}</Section>

          <Hr style={divider} />

          {/* ── Footer ──────────────────────────────────────── */}
          <Section style={footerSection}>
            <Text style={footerBrand}>
              {APP_NAME.slice(0, 4)}
              <span style={footerOrange}>{APP_NAME.slice(4)}</span>
            </Text>
            <Text style={footerTagline}>{APP_TAGLINE}</Text>
            {footerNote && <Text style={footerNoteStyle}>{footerNote}</Text>}
            <Text style={footerLinks}>
              <Link href={APP_BASE_URL} style={footerLink}>
                bitehubapp.com
              </Link>
              {" • "}
              <Link href={`mailto:${CONTACT_EMAIL}`} style={footerLink}>
                {CONTACT_EMAIL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailLayout

// ─── Shared styles (exported so templates can extend/reuse) ──────────────────

export const emailMain = {
  backgroundColor: EMAIL_THEME.colors.background,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

export const emailContainer = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
  backgroundColor: EMAIL_THEME.colors.background,
  border: `1px solid ${EMAIL_THEME.colors.border}`,
  borderRadius: "16px",
  marginTop: "40px",
  overflow: "hidden",
}

export const emailContentSection = {
  padding: "0 40px",
}

export const emailHeading = {
  fontSize: "20px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  marginBottom: "16px",
}

export const emailText = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 16px 0",
}

export const emailDivider = {
  borderColor: EMAIL_THEME.colors.border,
  margin: "20px 0",
}

export const emailButton = {
  backgroundColor: EMAIL_THEME.colors.primary,
  color: EMAIL_THEME.colors.background,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  margin: "16px 0",
  textAlign: "center" as const,
}

// ─── Internal layout styles ───────────────────────────────────────────────────

const main = emailMain
const container = emailContainer
const contentSection = emailContentSection
const divider = emailDivider

const headerSection = {
  padding: "32px 40px 10px 40px",
  textAlign: "center" as const,
}

const logoImg = {
  borderRadius: "12px",
  margin: "0 auto 12px auto",
  display: "block",
}

const logoText = {
  margin: "0",
  fontSize: "28px",
  fontWeight: "900",
  letterSpacing: "-0.05em",
  color: EMAIL_THEME.colors.foreground,
}

const logoHighlight = {
  color: EMAIL_THEME.colors.primary,
}

const subHeaderStyle = {
  margin: "4px 0 0 0",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: EMAIL_THEME.colors.textMuted,
}

const footerSection = {
  padding: "0 40px 8px",
  textAlign: "center" as const,
}

const footerBrand = {
  fontSize: "16px",
  fontWeight: "900",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 4px 0",
}

const footerOrange = {
  color: EMAIL_THEME.colors.primary,
}

const footerTagline = {
  fontSize: "12px",
  lineHeight: "18px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 6px 0",
  fontStyle: "italic" as const,
}

const footerNoteStyle = {
  fontSize: "12px",
  lineHeight: "18px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 6px 0",
}

const footerLinks = {
  fontSize: "12px",
  lineHeight: "18px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0",
}

const footerLink = {
  color: EMAIL_THEME.colors.textMuted,
  textDecoration: "underline",
}
