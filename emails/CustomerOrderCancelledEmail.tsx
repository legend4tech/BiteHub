import { Button, Section, Text } from "@react-email/components"
import * as React from "react"
import { APP_BASE_URL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface CustomerOrderCancelledEmailProps {
  customerName: string
  orderId: string
  vendorName: string
}

export const CustomerOrderCancelledEmail = ({
  customerName,
  orderId,
  vendorName,
}: CustomerOrderCancelledEmailProps) => {
  const reorderUrl = `${APP_BASE_URL}/menus`

  return (
    <EmailLayout
      preview={`Your BiteHub order ${orderId} was cancelled — payment not received`}
      subheader="Order Cancelled"
    >
      <Text style={text}>Hi {customerName},</Text>
      <Text style={text}>
        Unfortunately, your order <strong>{orderId}</strong> from{" "}
        <strong>{vendorName}</strong> has been automatically cancelled because
        payment was not completed before the end of the day.
      </Text>
      <Section style={infoBox}>
        <Text style={infoHeading}>Why was my order cancelled?</Text>
        <Text style={infoDesc}>
          Orders that are not paid for by 11:55 PM are automatically cancelled
          to keep vendor dashboards clean and inventory accurate. No money was
          charged — your payment session expired.
        </Text>
      </Section>
      <Text style={text}>
        Want to order again? Simply visit the vendor&apos;s menu and place a new
        order. The whole process takes less than a minute!
      </Text>
      <Button href={reorderUrl} style={button}>
        Browse Menus
      </Button>
    </EmailLayout>
  )
}

export default CustomerOrderCancelledEmail

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 16px 0",
}
const infoBox = {
  borderLeft: "4px solid #f59e0b",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
}
const infoHeading = {
  margin: "0 0 8px 0",
  fontSize: "14px",
  fontWeight: "bold",
  color: EMAIL_THEME.colors.warning,
}
const infoDesc = {
  margin: "0",
  fontSize: "14px",
  lineHeight: "22px",
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
