import { Link, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface EmailChangeNotificationProps {
  vendorName: string
  oldEmail: string
  newEmail: string
}

export const EmailChangeNotification = ({
  vendorName,
  oldEmail,
  newEmail,
}: EmailChangeNotificationProps) => {
  return (
    <EmailLayout
      preview="Security Alert: Email change requested for your BiteHub account"
      subheader="Security Alert"
    >
      <Heading style={heading}>Email Address Change Requested</Heading>
      <Text style={text}>Hello {vendorName || "Vendor"},</Text>
      <Text style={text}>
        A request was made to change the email address on your BiteHub vendor
        account.
      </Text>
      <Section style={detailsBox}>
        <Text style={detailItem}>
          <strong>Previous email:</strong> {oldEmail}
        </Text>
        <Text style={detailItem}>
          <strong>New email:</strong> {newEmail}
        </Text>
      </Section>
      <Text style={text}>
        A confirmation link has been sent to your new email address. The change
        will only take effect once you click that link to verify.
      </Text>
      <Text style={warningText}>
        <strong>{"Didn't request this change?"}</strong>
        <br />
        If you did not initiate this request, please contact us immediately at{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
          {CONTACT_EMAIL}
        </Link>
        . Your account may be at risk.
      </Text>
    </EmailLayout>
  )
}

export default EmailChangeNotification

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
const detailsBox = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
}
const detailItem = {
  fontSize: "14px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 6px 0",
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
