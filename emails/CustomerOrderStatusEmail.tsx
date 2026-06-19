import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Heading,
  Img,
} from "@react-email/components"
import * as React from "react"

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
    <Html>
      <Head />
      <Preview>Order Update: {statusLabel}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo / Header */}
          <Section style={headerSection}>
            <Img
              src="https://bitehubapp.com/brand_logo.png"
              alt="BiteHub"
              width="48"
              height="48"
              style={logoImg}
            />
            <Heading style={logoText}>
              Bite<span style={logoHighlight}>Hub</span>
            </Heading>
            <Text style={subHeader}>Order Update</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
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
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>BiteHub Support Team</Text>
            <Text style={footerText}>
              Need help? Reply to this email or contact us via the app.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default CustomerOrderStatusEmail

// ─── Styles ───────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  marginTop: "40px",
  overflow: "hidden",
}

const headerSection = {
  padding: "32px 40px 10px 40px",
  textAlign: "center" as const,
}

const logoImg = {
  borderRadius: "12px",
  margin: "0 auto 12px auto",
  display: "block",
}

const logoText = {
  margin: "0",
  fontSize: "28px",
  fontWeight: "900",
  letterSpacing: "-0.05em",
  color: "#111827",
}

const logoHighlight = {
  color: "#ff6b00",
}

const subHeader = {
  margin: "4px 0 0 0",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#6b7280",
}

const divider = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
}

const contentSection = {
  padding: "0 40px",
}

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 16px 0",
}

const statusBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
  textAlign: "center" as const,
}

const statusHeading = {
  margin: "0 0 8px 0",
  fontSize: "18px",
  fontWeight: "bold",
  color: "#111827",
}

const statusDesc = {
  margin: "0",
  fontSize: "14px",
  color: "#4b5563",
}

const button = {
  backgroundColor: "#ff6b00",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  margin: "16px 0",
  textAlign: "center" as const,
  width: "100%",
}

const footerSection = {
  padding: "0 40px",
  textAlign: "center" as const,
}

const footerText = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#9ca3af",
  margin: "0 0 6px 0",
}
