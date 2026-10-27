import { Link, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface AdminPlatformFeeOtpEmailProps {
  adminName: string
  otp: string
  expiryMinutes: number
}

export const AdminPlatformFeeOtpEmail = ({
  adminName,
  otp,
  expiryMinutes,
}: AdminPlatformFeeOtpEmailProps) => {
  return (
    <EmailLayout
      preview={`BiteHub Platform Fee Change OTP: ${otp}`}
      subheader="Admin Security Verification"
    >
      <Heading style={heading}>Authorize Platform Fee Change</Heading>
      <Text style={text}>Hello {adminName || "Admin"},</Text>
      <Text style={text}>
        A request was initiated from your admin account to modify the global
        platform commission fee percentage on BiteHub. Please enter the
        following 6-digit authorization code to confirm this change:
      </Text>
      <Section style={otpSection}>
        <Text style={otpText}>{otp}</Text>
      </Section>
      <Text style={text}>
        This verification code expires in{" "}
        <strong>{expiryMinutes} minutes</strong>.
      </Text>
      <Text style={warningText}>
        <strong>Did not make this request?</strong>
        <br />
        If you did not initiate this change, do not share this code. Your admin
        account may be compromised. Please reset your admin password immediately
        or notify support at{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
          {CONTACT_EMAIL}
        </Link>
        .
      </Text>
    </EmailLayout>
  )
}

export default AdminPlatformFeeOtpEmail

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
