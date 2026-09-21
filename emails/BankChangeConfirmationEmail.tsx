import { Link, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface BankChangeConfirmationEmailProps {
  vendorName: string
  bankName: string
  accountNumber: string
  lockDays: number
}

export const BankChangeConfirmationEmail = ({
  vendorName,
  bankName,
  accountNumber,
  lockDays,
}: BankChangeConfirmationEmailProps) => {
  // Mask account number to show only last 4 digits
  const maskedAccount =
    accountNumber.length > 4
      ? `******${accountNumber.slice(-4)}`
      : accountNumber

  return (
    <EmailLayout
      preview="Your BiteHub Payout Bank Details Were Updated"
      subheader="Bank Details Updated"
    >
      <Heading style={heading}>Payout Account Updated Successfully</Heading>
      <Text style={text}>Hello {vendorName || "Vendor"},</Text>
      <Text style={text}>
        You have successfully updated your bank account for receiving payouts on
        BiteHub.
      </Text>
      <Section style={detailsSection}>
        <Text style={detailText}>
          <strong>New Bank Name:</strong> {bankName}
        </Text>
        <Text style={detailText}>
          <strong>New Account Number:</strong> {maskedAccount}
        </Text>
      </Section>
      <Text style={warningText}>
        <strong>Security Lock Active</strong>
        <br />
        To protect your funds, you cannot change these bank details again for
        the next <strong>{lockDays} days</strong>. After this period, any
        changes will require an email verification code.
      </Text>
      <Text style={text}>
        If you did not authorize this change, your account may be compromised.
        Please contact support immediately at{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
          {CONTACT_EMAIL}
        </Link>
        .
      </Text>
    </EmailLayout>
  )
}

export default BankChangeConfirmationEmail

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
const warningText = {
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
