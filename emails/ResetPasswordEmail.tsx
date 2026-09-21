import { Button, Section, Text, Link, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface ResetPasswordEmailProps {
  vendorName: string
  resetLink: string
  expiryMinutes: number
  userType?: "vendor" | "customer"
}

export const ResetPasswordEmail = ({
  vendorName,
  resetLink,
  expiryMinutes,
  userType = "vendor",
}: ResetPasswordEmailProps) => {
  return (
    <EmailLayout
      preview={`Reset your BiteHub ${userType} account password`}
      subheader={
        userType === "customer" ? "Customer Account" : "Vendor Account"
      }
    >
      <Heading style={heading}>Password Reset Request</Heading>
      <Text style={text}>
        Hello {vendorName || (userType === "customer" ? "Customer" : "Vendor")},
      </Text>
      <Text style={text}>
        We received a request to reset the password for your BiteHub
        {userType === "customer" ? " customer " : " vendor "} account. Click the
        button below to create a new password:
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={resetLink}>
          Reset My Password
        </Button>
      </Section>

      <Text style={text}>Or copy and paste this link into your browser:</Text>
      <Text style={linkText}>
        <Link href={resetLink} style={link}>
          {resetLink}
        </Link>
      </Text>

      <Text style={warningText}>
        ⏱ This link expires in <strong>{expiryMinutes} minutes</strong>. If you
        did not request a password reset, you can safely ignore this email —
        your password will remain unchanged.
      </Text>
    </EmailLayout>
  )
}

export default ResetPasswordEmail

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
const buttonContainer = { textAlign: "center" as const, margin: "24px 0" }
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
const link = { color: EMAIL_THEME.colors.primary, textDecoration: "underline" }
const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.textMuted,
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "16px",
  borderRadius: "8px",
  margin: "0 0 20px 0",
}
