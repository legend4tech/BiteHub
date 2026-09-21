import { Button, Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface CustomerWelcomeEmailProps {
  customerName: string
  dashboardUrl: string
}

export const CustomerWelcomeEmail = ({
  customerName,
  dashboardUrl,
}: CustomerWelcomeEmailProps) => {
  return (
    <EmailLayout
      preview="Welcome to BiteHub! Ready to order some food?"
      subheader="Customer Account Created"
    >
      <Heading style={heading}>Welcome to BiteHub, {customerName}! 🍕</Heading>
      <Text style={text}>
        Your BiteHub customer account has been successfully created. We are
        thrilled to have you on board! You can now start ordering delicious food
        right to your campus.
      </Text>
      <Text style={featureText}>
        <strong>🚀 What you can do now:</strong>
        <br />
        <br />
        🍔 <strong>Fast Checkout:</strong> Skip the queues and order from your
        favorite campus vendors with ease.
        <br />
        <br />
        💰 <strong>BiteHub Wallet:</strong> Top up your wallet for seamless
        one-click payments and track your spending.
        <br />
        <br />
        🎁 <strong>Refer &amp; Earn:</strong> Share your referral code with
        friends to earn BiteHub Coins for every successful signup!
      </Text>
      <Button href={dashboardUrl} style={button}>
        Order Food Now
      </Button>
    </EmailLayout>
  )
}

export default CustomerWelcomeEmail

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
const featureText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: EMAIL_THEME.colors.foreground,
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "20px",
  borderRadius: "8px",
  margin: "0 0 24px 0",
}
const button = {
  backgroundColor: EMAIL_THEME.colors.primary,
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
