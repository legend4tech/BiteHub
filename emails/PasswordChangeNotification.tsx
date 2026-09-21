import { Link, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface PasswordChangeNotificationProps {
  vendorName: string
}

export const PasswordChangeNotification = ({
  vendorName,
}: PasswordChangeNotificationProps) => {
  return (
    <EmailLayout
      preview="Security Alert: Your BiteHub password has been changed"
      subheader="Security Alert"
    >
      <Heading style={heading}>Password Changed Successfully</Heading>
      <Text style={text}>Hello {vendorName || "Vendor"},</Text>
      <Text style={text}>
        This email is to confirm that the password for your BiteHub vendor
        account was recently changed.
      </Text>
      <Text style={text}>
        As a security precaution, any active sessions on other devices have been
        automatically signed out.
      </Text>
      <Section style={warningBox}>
        <Text style={warningText}>
          <strong>{"Didn't change your password?"}</strong>
          <br />
          If you did not make this change, your account may be compromised.
          Contact us immediately at{" "}
          <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
            {CONTACT_EMAIL}
          </Link>
          .
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default PasswordChangeNotification

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
const warningBox = { margin: "16px 0" }
const warningText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.warning,
  backgroundColor: EMAIL_THEME.colors.warningBackground,
  padding: "20px",
  borderRadius: "8px",
  border: `1px solid ${EMAIL_THEME.colors.warning}`,
}
const link = { color: EMAIL_THEME.colors.warning, textDecoration: "underline" }
