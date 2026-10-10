import { Button, Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"
import { APP_BASE_URL } from "@/lib/constants"

export const SubscriberWelcomeEmail = () => {
  return (
    <EmailLayout
      preview="Welcome to the BiteHub family!"
      subheader="Subscription Confirmed"
    >
      <Heading style={heading}>Welcome to BiteHub! 🚀</Heading>
      <Text style={text}>
        Thanks for subscribing! You are now on the list to receive the latest
        updates, special offers, and campus food news from BiteHub.
      </Text>
      <Text style={featureText}>
        <strong>Stay tuned for:</strong>
        <br />
        <br />
        🍔 <strong>Exclusive Discounts:</strong> Be the first to know about
        vendor promos and flash sales.
        <br />
        <br />
        📣 <strong>New Vendors:</strong> Get notified when we add exciting new
        food options to your campus.
        <br />
        <br />✨ <strong>Platform Updates:</strong> Learn about new features we
        are building to make campus ordering better.
      </Text>
      <Button href={APP_BASE_URL} style={button}>
        Visit BiteHub
      </Button>
    </EmailLayout>
  )
}

export default SubscriberWelcomeEmail

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
