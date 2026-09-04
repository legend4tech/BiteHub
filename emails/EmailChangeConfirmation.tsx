import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
  Heading,
  Img,
} from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"

interface EmailChangeConfirmationProps {
  vendorName: string
  confirmLink: string
  expiryMinutes?: number
}

export const EmailChangeConfirmation = ({
  vendorName,
  confirmLink,
  expiryMinutes = 1440,
}: EmailChangeConfirmationProps) => {
  const formatExpiry = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.round(minutes / 60)
      return `${hours} hour${hours > 1 ? "s" : ""}`
    }
    return `${minutes} minute${minutes > 1 ? "s" : ""}`
  }

  const expiryText = formatExpiry(expiryMinutes)
  return (
    <Html>
      <Head />
      <Preview>Confirm your new email address for BiteHub</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo / Header */}
          <Section style={headerSection}>
            <Img
              src="https://bitehubapp.com/brand_logo.png"
              alt="BiteHub"
              width="48"
              height="48"
              style={logoImg}
            />
            <Heading style={logoText}>
              Bite<span style={logoHighlight}>Hub</span>
            </Heading>
            <Text style={subHeader}>Email Verification</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Confirm New Email</Heading>
            <Text style={text}>Hello {vendorName || "Vendor"},</Text>
            <Text style={text}>
              Please confirm this email address to update your BiteHub vendor
              account login. Click the button below to verify:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={confirmLink}>
                Confirm Email Address
              </Button>
            </Section>

            <Text style={text}>
              Or copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>
              <Link href={confirmLink} style={link}>
                {confirmLink}
              </Link>
            </Text>

            <Text style={warningText}>
              ⏱ This link expires in <strong>{expiryText}</strong>. If you did
              not request this change, you can safely ignore this email.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              BiteHub — Smart Food Ordering for Everyone
            </Text>
            <Text style={footerText}>
              This is an automated message. Please do not reply to this email.
            </Text>
            <Text style={footerText}>
              <Link href="https://bitehubapp.com" style={footerLink}>
                bitehubapp.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailChangeConfirmation

// ─── Styles ───────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: EMAIL_THEME.colors.background,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
  backgroundColor: EMAIL_THEME.colors.background,
  border: `1px solid ${EMAIL_THEME.colors.border}`,
  borderRadius: "16px",
  marginTop: "40px",
  overflow: "hidden",
}

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

const subHeader = {
  margin: "4px 0 0 0",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: EMAIL_THEME.colors.textMuted,
}

const divider = {
  borderColor: EMAIL_THEME.colors.border,
  margin: "20px 0",
}

const contentSection = {
  padding: "0 40px",
}

const heading = {
  fontSize: "20px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  marginBottom: "16px",
}

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 16px 0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
}

const button = {
  backgroundColor: EMAIL_THEME.colors.primary,
  borderRadius: "8px",
  color: EMAIL_THEME.colors.background,
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 28px",
}

const linkText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.primary,
  margin: "0 0 24px 0",
  wordBreak: "break-all" as const,
}

const link = {
  color: EMAIL_THEME.colors.primary,
  textDecoration: "underline",
}

const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.textMuted,
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "16px",
  borderRadius: "8px",
  margin: "0 0 20px 0",
}

const footerSection = {
  padding: "0 40px",
  textAlign: "center" as const,
}

const footerText = {
  fontSize: "12px",
  lineHeight: "18px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 6px 0",
}

const footerLink = {
  color: EMAIL_THEME.colors.textMuted,
  textDecoration: "underline",
}
