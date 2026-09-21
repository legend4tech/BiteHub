import { Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface AdminPasswordChangedEmailProps {
  adminName: string
  email: string
}

export const AdminPasswordChangedEmail = ({
  adminName,
  email,
}: AdminPasswordChangedEmailProps) => {
  return (
    <EmailLayout
      preview="Security Alert: Admin Password Changed"
      subheader="Security Alert"
    >
      <Heading style={heading}>Admin Password Changed</Heading>
      <Text style={text}>Hi {adminName || "Admin"},</Text>
      <Text style={text}>
        The password for your BiteHub Admin account (<strong>{email}</strong>)
        was just changed.
      </Text>
      <Text style={text}>
        If you made this change, you can safely ignore this email.
      </Text>
      <Section style={warningBox}>
        <Text style={warningText}>
          <strong>{"Didn't make this change?"}</strong>
          <br />
          If you did NOT make this change, please contact your security team or
          reset your password immediately.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default AdminPasswordChangedEmail

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

const warningBox = {
  margin: "24px 0",
}

const warningText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.warning,
  backgroundColor: EMAIL_THEME.colors.warningBackground,
  padding: "20px",
  borderRadius: "8px",
  border: `1px solid ${EMAIL_THEME.colors.warning}`,
}
