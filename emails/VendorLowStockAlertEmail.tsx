import { Button, Section, Text } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface VendorLowStockAlertEmailProps {
  vendorName: string
  itemName: string
  remainingQuantity: number
  dashboardUrl: string
}

export const VendorLowStockAlertEmail = ({
  vendorName = "Vendor",
  itemName = "Food Item",
  remainingQuantity = 0,
  dashboardUrl = "https://bitehubapp.com/vendor/dashboard",
}: VendorLowStockAlertEmailProps) => {
  return (
    <EmailLayout
      preview={`Low Stock Alert: ${itemName} is running out!`}
      subheader="Stock Alert"
    >
      <Text style={text}>Hello {vendorName},</Text>
      <Text style={text}>
        This is an automated alert to let you know that{" "}
        <strong>{itemName}</strong> is running low. You only have{" "}
        <strong>{remainingQuantity}</strong> portions left in stock.
      </Text>

      <Section style={alertSection}>
        <Text style={alertText}>
          <strong>Item:</strong> {itemName}
          <br />
          <strong>Remaining Stock:</strong> {remainingQuantity}
        </Text>
      </Section>

      <Text style={text}>
        If you have cooked a fresh batch, please log into your vendor dashboard
        and update the quantity so you don&apos;t miss out on sales!
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          Update Menu Stock
        </Button>
      </Section>
    </EmailLayout>
  )
}

export default VendorLowStockAlertEmail

const text = {
  color: EMAIL_THEME.colors.textMuted,
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
}

const alertSection = {
  padding: "24px",
  backgroundColor: EMAIL_THEME.colors.warningBackground,
  borderRadius: "8px",
  margin: "24px 0",
  borderLeft: `4px solid ${EMAIL_THEME.colors.warning}`,
}

const alertText = {
  color: EMAIL_THEME.colors.warning,
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
}

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
}

const button = {
  backgroundColor: EMAIL_THEME.colors.primary,
  borderRadius: "8px",
  color: EMAIL_THEME.colors.background,
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
}
