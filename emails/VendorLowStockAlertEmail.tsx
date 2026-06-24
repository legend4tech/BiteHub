import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

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
    <Html>
      <Head />
      <Preview>Low Stock Alert: {itemName} is running out!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Low Stock Alert</Heading>
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
            If you have cooked a fresh batch, please log into your vendor
            dashboard and update the quantity so you don&apos;t miss out on
            sales!
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Update Menu Stock
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>BiteHub • Your Campus Food Companion</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
}

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  textAlign: "center" as const,
  padding: "0 48px",
  color: "#484848",
}

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
  padding: "0 48px",
}

const alertSection = {
  padding: "24px",
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
  margin: "24px 48px",
  borderLeft: "4px solid #f59e0b",
}

const alertText = {
  color: "#92400e",
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
  backgroundColor: "#f97316", // Brand primary color
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
}

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
}

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
}

export default VendorLowStockAlertEmail
