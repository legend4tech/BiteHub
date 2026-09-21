import { Button, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface VendorWelcomeEmailProps {
  vendorName: string
  email: string
  passwordPlain: string
  dashboardUrl: string
}

export const VendorWelcomeEmail = ({
  vendorName,
  email,
  passwordPlain,
  dashboardUrl,
}: VendorWelcomeEmailProps) => {
  return (
    <EmailLayout
      preview="Welcome to BiteHub! Here are your login details."
      subheader="Vendor Account Created"
    >
      <Heading style={heading}>Welcome aboard, {vendorName}! 🎉</Heading>
      <Text style={text}>
        Your BiteHub vendor account has been successfully created by an
        administrator. You can now log in to manage your store, upload your
        menu, and start receiving orders.
      </Text>

      <Section style={credentialsBox}>
        <Text style={credentialsHeading}>Your Login Credentials</Text>
        <Text style={credentialItem}>
          <strong>Email:</strong> {email}
        </Text>
        <Text style={credentialItem}>
          <strong>Temporary Password:</strong> {passwordPlain}
        </Text>
      </Section>

      <Text style={warningText}>
        <strong>⚠️ Important Next Steps:</strong>
        <br />
        <br />
        1. <strong>Change your password:</strong> Please log in and change your
        temporary password immediately from your Profile Settings.
        <br />
        <br />
        2. <strong>Set up your menu:</strong> Navigate to the Menu section to
        add your items, prices, and categories so customers can start ordering.
        <br />
        <br />
        3. <strong>Bank Details:</strong> Don&apos;t forget to set up your
        payout bank details in settings so you can receive your funds!
      </Text>

      <Button href={dashboardUrl} style={button}>
        Log In to Vendor Dashboard
      </Button>
    </EmailLayout>
  )
}

export default VendorWelcomeEmail

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

const credentialsBox = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  border: "1px dashed #d1d5db",
}

const credentialsHeading = {
  margin: "0 0 12px 0",
  fontSize: "16px",
  fontWeight: "bold",
  color: EMAIL_THEME.colors.foreground,
}

const credentialItem = {
  margin: "0 0 8px 0",
  fontSize: "15px",
  color: EMAIL_THEME.colors.foreground,
}

const warningText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: `${EMAIL_THEME.colors.warning}`,
  backgroundColor: `${EMAIL_THEME.colors.warningBackground}`,
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  border: `1px solid ${EMAIL_THEME.colors.warning}`,
}

const button = {
  backgroundColor: EMAIL_THEME.colors.foreground,
  color: EMAIL_THEME.colors.background,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  margin: "16px 0",
  textAlign: "center" as const,
  width: "100%",
}
