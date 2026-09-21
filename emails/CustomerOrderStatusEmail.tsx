import { Button, Section, Text } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface CustomerOrderStatusEmailProps {
  customerName: string
  orderId: string
  vendorName: string
  statusLabel: string
  statusDescription: string
  trackingUrl: string
}

export const CustomerOrderStatusEmail = ({
  customerName,
  orderId,
  vendorName,
  statusLabel,
  statusDescription,
  trackingUrl,
}: CustomerOrderStatusEmailProps) => {
  return (
    <EmailLayout
      preview={`Order Update: ${statusLabel}`}
      subheader="Order Update"
    >
      <Text style={text}>Hi {customerName},</Text>
      <Text style={text}>
        There is an update on your order <strong>{orderId}</strong> from{" "}
        <strong>{vendorName}</strong>.
      </Text>
      <Section style={statusBox}>
        <Text style={statusHeading}>Status: {statusLabel}</Text>
        <Text style={statusDesc}>{statusDescription}</Text>
      </Section>
      <Button href={trackingUrl} style={button}>
        Track Order
      </Button>
    </EmailLayout>
  )
}

export default CustomerOrderStatusEmail

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 16px 0",
}
const statusBox = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  textAlign: "center" as const,
}
const statusHeading = {
  margin: "0 0 8px 0",
  fontSize: "18px",
  fontWeight: "bold",
  color: EMAIL_THEME.colors.foreground,
}
const statusDesc = {
  margin: "0",
  fontSize: "14px",
  color: EMAIL_THEME.colors.textMuted,
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
