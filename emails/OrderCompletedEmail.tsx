import { Button, Link, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { SUPPORT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface OrderCompletedEmailProps {
  customerName: string
  orderId: string
  vendorName: string
  reviewUrl: string
}

export const OrderCompletedEmail = ({
  customerName,
  orderId,
  vendorName,
  reviewUrl,
}: OrderCompletedEmailProps) => {
  return (
    <EmailLayout
      preview={`Rate your BiteHub order from ${vendorName}!`}
      subheader="Order Completed"
    >
      <Heading style={heading}>How was your food?</Heading>
      <Text style={text}>Hello {customerName},</Text>
      <Text style={text}>
        Your order (<strong>{orderId}</strong>) from{" "}
        <strong>{vendorName}</strong> has been marked as completed! We hope you
        enjoyed your meal.
      </Text>
      <Text style={text}>
        Please take a moment to rate the vendor. Your feedback helps other
        students discover the best food on campus, and helps vendors improve
        their service!
      </Text>
      <Section style={buttonContainer}>
        <Button href={reviewUrl} style={button}>
          Leave a Review ⭐
        </Button>
      </Section>
      <Text style={text}>
        If you have any issues with your order, please reach out to us at{" "}
        <Link href={`mailto:${SUPPORT_EMAIL}`} style={link}>
          {SUPPORT_EMAIL}
        </Link>
        .
      </Text>
    </EmailLayout>
  )
}

export default OrderCompletedEmail

const heading = {
  fontSize: "22px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  marginBottom: "16px",
}
const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 16px 0",
}
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" }
const button = {
  backgroundColor: EMAIL_THEME.colors.primary,
  borderRadius: "8px",
  color: EMAIL_THEME.colors.background,
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
}
const link = { color: EMAIL_THEME.colors.primary, textDecoration: "underline" }
