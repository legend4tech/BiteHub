import { Link, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL, APP_NAME } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface CustomerVerificationOtpEmailProps {
  customerName: string
  otp: string
  expiryMinutes?: number
}

export const CustomerVerificationOtpEmail = ({
  customerName,
  otp,
  expiryMinutes = 15,
}: CustomerVerificationOtpEmailProps) => {
  return (
    <EmailLayout
      preview={`Your ${APP_NAME} Verification Code: ${otp}`}
      subheader="Account Verification"
    >
      <Heading style={heading}>Verify Your Email Address</Heading>
      <Text style={text}>Hello {customerName || "there"},</Text>
      <Text style={text}>
        Welcome to {APP_NAME}! To complete your registration and activate your
        account, please enter the following 6-digit verification code:
      </Text>
      <Section style={otpSection}>
        <Text style={otpText}>{otp}</Text>
      </Section>
      <Text style={text}>
        This verification code will expire in{" "}
        <strong>{expiryMinutes} minutes</strong>.
      </Text>
      <Text style={securityNotice}>
        <strong>Didn&apos;t create a {APP_NAME} account?</strong>
        <br />
        If you did not sign up for {APP_NAME}, you can safely ignore this email.
        Someone may have entered your email address by mistake. If you have any
        concerns, reach out to our team at{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
          {CONTACT_EMAIL}
        </Link>
        .
      </Text>
    </EmailLayout>
  )
}

export default CustomerVerificationOtpEmail

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

const otpSection = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const otpText = {
  fontSize: "32px",
  fontWeight: "700",
  letterSpacing: "8px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0",
}

const securityNotice = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.textMuted,
  backgroundColor: EMAIL_THEME.colors.background,
  padding: "16px",
  borderRadius: "8px",
  margin: "20px 0",
  border: `1px solid ${EMAIL_THEME.colors.border}`,
}

const link = { color: EMAIL_THEME.colors.primary, textDecoration: "underline" }
