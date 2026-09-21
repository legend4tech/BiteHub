import { Button, Link, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

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
    <EmailLayout
      preview="Confirm your new email address for BiteHub"
      subheader="Email Verification"
    >
      <Heading style={heading}>Confirm Your New Email Address</Heading>
      <Text style={text}>Hello {vendorName || "Vendor"},</Text>
      <Text style={text}>
        You recently requested to change the email address on your BiteHub
        vendor account. Click the button below to confirm and activate your new
        email address.
      </Text>
      <Section style={buttonContainer}>
        <Button href={confirmLink} style={button}>
          Confirm New Email
        </Button>
      </Section>
      <Text style={warningText}>
        This link will expire in <strong>{expiryText}</strong>. If you did not
        request this change, please contact us immediately at{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
          {CONTACT_EMAIL}
        </Link>
        .
      </Text>
    </EmailLayout>
  )
}

export default EmailChangeConfirmation

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
  color: EMAIL_THEME.colors.background,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
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
const link = {
  color: EMAIL_THEME.colors.destructive,
  textDecoration: "underline",
}
