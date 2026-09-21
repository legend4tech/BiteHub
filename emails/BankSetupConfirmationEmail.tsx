import { Link, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface BankSetupConfirmationEmailProps {
  vendorName: string
  bankName: string
  accountNumber: string
  lockDays: number
}

export const BankSetupConfirmationEmail = ({
  vendorName,
  bankName,
  accountNumber,
  lockDays,
}: BankSetupConfirmationEmailProps) => {
  const maskedAccount =
    accountNumber.length > 4
      ? `******${accountNumber.slice(-4)}`
      : accountNumber

  return (
    <EmailLayout
      preview="Your BiteHub Payout Bank Details Are Set Up"
      subheader="Bank Details Configured"
    >
      <Heading style={heading}>Payout Account Set Successfully</Heading>
      <Text style={text}>Hello {vendorName || "Vendor"},</Text>
      <Text style={text}>
        You have successfully connected your bank account for receiving payouts
        on BiteHub.
      </Text>
      <Section style={detailsSection}>
        <Text style={detailText}>
          <strong>Bank Name:</strong> {bankName}
        </Text>
        <Text style={detailText}>
          <strong>Account Number:</strong> {maskedAccount}
        </Text>
      </Section>
      <Text style={lockText}>
        <strong>Security Lock Active</strong>
        <br />
        To protect your funds, you cannot change these bank details for the next{" "}
        <strong>{lockDays} days</strong>. After this period, any changes will
        require an email verification code.
      </Text>
      <Text style={text}>
        If you did not authorize this setup, please contact support immediately
        at{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
          {CONTACT_EMAIL}
        </Link>
        .
      </Text>
    </EmailLayout>
  )
}

export default BankSetupConfirmationEmail

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
const detailsSection = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "16px",
  borderRadius: "8px",
  margin: "16px 0",
}
const detailText = {
  fontSize: "15px",
  margin: "0 0 8px 0",
  color: EMAIL_THEME.colors.foreground,
}
const lockText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.success,
  backgroundColor: EMAIL_THEME.colors.successBackground,
  padding: "16px",
  borderRadius: "8px",
  margin: "20px 0",
  border: `1px solid ${EMAIL_THEME.colors.success}`,
}
const link = { color: EMAIL_THEME.colors.primary, textDecoration: "underline" }
