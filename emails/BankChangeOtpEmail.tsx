import { Link, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface BankChangeOtpEmailProps {
  vendorName: string
  otp: string
  expiryMinutes: number
}

export const BankChangeOtpEmail = ({
  vendorName,
  otp,
  expiryMinutes,
}: BankChangeOtpEmailProps) => {
  return (
    <EmailLayout
      preview={`BiteHub Bank Update Verification Code: ${otp}`}
      subheader="Security Verification"
    >
      <Heading style={heading}>Verify Bank Account Change</Heading>
      <Text style={text}>Hello {vendorName || "Vendor"},</Text>
      <Text style={text}>
        We received a request to change the payout bank details for your BiteHub
        vendor account. Please enter the following 6-digit code to authorize
        this change:
      </Text>
      <Section style={otpSection}>
        <Text style={otpText}>{otp}</Text>
      </Section>
      <Text style={text}>
        This code will expire in <strong>{expiryMinutes} minutes</strong>.
      </Text>
      <Text style={warningText}>
        <strong>Didn&apos;t make this request?</strong>
        <br />
        If you did not authorize this change, do not share this code with
        anyone. Your account may be compromised. Please reset your password
        immediately or contact support at{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
          {CONTACT_EMAIL}
        </Link>
        .
      </Text>
    </EmailLayout>
  )
}

export default BankChangeOtpEmail

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
const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.destructive,
  backgroundColor: EMAIL_THEME.colors.destructiveBackground,
  padding: "16px",
  borderRadius: "8px",
  margin: "20px 0",
  border: `1px solid ${EMAIL_THEME.colors.destructive}`,
}
const link = { color: EMAIL_THEME.colors.primary, textDecoration: "underline" }
