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
import { EMAIL_THEME } from "../lib/email-theme"

interface OrderCompletedEmailProps {
  customerName: string
  orderId: string
  vendorName: string
  trackingUrl: string
}

export const OrderCompletedEmail = ({
  customerName,
  orderId,
  vendorName,
  trackingUrl,
}: OrderCompletedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Rate your BiteHub order from {vendorName}!</Preview>
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
            <Text style={subHeader}>Order Completed</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>How was your food?</Heading>
            <Text style={text}>Hello {customerName},</Text>
            <Text style={text}>
              Your order (<strong>{orderId}</strong>) from{" "}
              <strong>{vendorName}</strong> has been marked as completed! We
              hope you enjoyed your meal.
            </Text>
            <Text style={text}>
              Please take a moment to rate the vendor. Your feedback helps other
              students discover the best food on campus, and helps vendors
              improve their service!
            </Text>

            <Section style={buttonContainer}>
              <Button href={trackingUrl} style={button}>
                Rate Vendor ⭐
              </Button>
            </Section>

            <Text style={text}>
              If you have any issues with your order, please reach out to us at{" "}
              <Link href={`mailto:${SUPPORT_EMAIL}`} style={link}>
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

export default OrderCompletedEmail

// ─── Styles ─────────────────────────────────────────────────────────────

const main = {
  backgroundColor: EMAIL_THEME.colors.background,
  fontFamily: EMAIL_THEME.fonts.sans,
}

const container = {
  backgroundColor: EMAIL_THEME.colors.background,
  margin: "40px auto",
  padding: "0",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  maxWidth: "600px",
  overflow: "hidden",
}

const headerSection = {
  backgroundColor: EMAIL_THEME.colors.successBackground, // green tint
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
  color: EMAIL_THEME.colors.foreground, // foreground
}

const logoHighlight = {
  color: EMAIL_THEME.colors.primary, // primary
}

const subHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: EMAIL_THEME.colors.success, // green
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
}

const divider = {
  borderTop: `1px solid ${EMAIL_THEME.colors.border}`,
  margin: "0",
}

const contentSection = {
  padding: "40px",
}

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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

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

const link = {
  color: EMAIL_THEME.colors.primary,
  textDecoration: "underline",
}

const footerSection = {
  backgroundColor: EMAIL_THEME.colors.background, // fallback to standard background
  borderTop: `1px solid ${EMAIL_THEME.colors.border}`,
  padding: "32px 40px",
  textAlign: "center" as const,
}

const footerText = {
  fontSize: "13px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 8px",
}

const footerLink = {
  color: EMAIL_THEME.colors.textMuted,
  textDecoration: "underline",
}
