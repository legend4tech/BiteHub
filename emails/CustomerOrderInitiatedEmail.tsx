import { Button, Section, Text, Link, Heading } from "@react-email/components"
import * as React from "react"
import { SUPPORT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface CustomerOrderInitiatedEmailProps {
  customerName: string
  orderId: string
  vendorName: string
  totalAmount: number
  trackingUrl: string
}

export const CustomerOrderInitiatedEmail = ({
  customerName,
  orderId,
  vendorName,
  totalAmount,
  trackingUrl,
}: CustomerOrderInitiatedEmailProps) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <EmailLayout
      preview={`Action Required: Complete your BiteHub Order ${orderId}`}
      subheader="Payment Pending"
    >
      <Heading style={heading}>We have saved your order!</Heading>
      <Text style={text}>Hello {customerName},</Text>
      <Text style={text}>
        You recently initiated an order (<strong>{orderId}</strong>) from{" "}
        <strong>{vendorName}</strong> for{" "}
        <strong>{formatPrice(totalAmount)}</strong>.
      </Text>
      <Text style={text}>
        If you closed the payment page by mistake or experienced a network
        issue, don&apos;t worry! Your order is securely saved.
      </Text>

      <Section style={buttonContainer}>
        <Button href={trackingUrl} style={button}>
          Complete Payment / Track Order
        </Button>
      </Section>

      <Text style={text}>
        If you have already paid, you can use the button above to track the
        status of your order. If you have any issues, please reach out to us at{" "}
        <Link href={`mailto:${SUPPORT_EMAIL}`} style={link}>
          {SUPPORT_EMAIL}
        </Link>
        .
      </Text>
    </EmailLayout>
  )
}

export default CustomerOrderInitiatedEmail

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 24px",
}
const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 16px",
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
