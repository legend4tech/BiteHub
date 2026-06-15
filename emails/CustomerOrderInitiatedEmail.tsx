import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
  Heading,
  Img,
  Button,
} from "@react-email/components"
import * as React from "react"
import { SUPPORT_EMAIL } from "@/lib/constants"

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
    <Html>
      <Head />
      <Preview>Action Required: Complete your BiteHub Order {orderId}</Preview>
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
            <Text style={subHeader}>Payment Pending</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
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
              If you have already paid, you can use the button above to track
              the status of your order. If you have any issues, please reach out
              to us at{" "}
              <Link href={`mailto:{SUPPORT_EMAIL}`} style={link}>
                {SUPPORT_EMAIL}
              </Link>
              .
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              BiteHub — Order Campus Food, Fast & Easy
            </Text>
            <Text style={footerText}>
              This is an automated message. Please do not reply to this email.
            </Text>
            <Text style={footerText}>
              <Link href="https://bitehubapp.com" style={footerLink}>
                bitehubapp.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default CustomerOrderInitiatedEmail

// ─── Styles ─────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "0",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  maxWidth: "600px",
  overflow: "hidden",
}

const headerSection = {
  backgroundColor: "#fff5f2",
  padding: "32px 40px",
  textAlign: "center" as const,
}

const logoImg = {
  margin: "0 auto",
  display: "block",
}

const logoText = {
  fontSize: "24px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: "12px 0 4px",
  color: "#18181b", // foreground
}

const logoHighlight = {
  color: "#FF5B22", // primary
}

const subHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#f59e0b", // amber
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
}

const divider = {
  borderTop: "1px solid #f1f5f9",
  margin: "0",
}

const contentSection = {
  padding: "40px",
}

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#18181b",
  margin: "0 0 24px",
}

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#475569",
  margin: "0 0 16px",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#FF5B22",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
}

const link = {
  color: "#FF5B22",
  textDecoration: "underline",
}

const footerSection = {
  backgroundColor: "#f8fafc",
  padding: "32px 40px",
  textAlign: "center" as const,
}

const footerText = {
  fontSize: "13px",
  color: "#64748b",
  margin: "0 0 8px",
}

const footerLink = {
  color: "#94a3b8",
  textDecoration: "underline",
}
