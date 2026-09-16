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
import { EMAIL_THEME } from "@/lib/email-theme"

interface CustomerWelcomeEmailProps {
  customerName: string
  dashboardUrl: string
}

export const CustomerWelcomeEmail = ({
  customerName,
  dashboardUrl,
}: CustomerWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to BiteHub! Ready to order some food?</Preview>
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
            <Text style={subHeader}>Customer Account Created</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>
              Welcome to BiteHub, {customerName}! 🍕
            </Heading>
            <Text style={text}>
              Your BiteHub customer account has been successfully created. We
              are thrilled to have you on board! You can now start ordering
              delicious food right to your campus.
            </Text>

            <Text style={featureText}>
              <strong>🚀 What you can do now:</strong>
              <br />
              <br />
              🍔 <strong>Fast Checkout:</strong> Skip the queues and order from
              your favorite campus vendors with ease.
              <br />
              <br />
              💰 <strong>BiteHub Wallet:</strong> Top up your wallet for
              seamless one-click payments and track your spending.
              <br />
              <br />
              🎁 <strong>Refer & Earn:</strong> Share your referral code with
              friends to earn BiteHub Coins for every successful signup!
            </Text>

            <Button href={dashboardUrl} style={button}>
              Order Food Now
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>BiteHub Customer Success Team</Text>
            <Text style={footerText}>
              Need help? Reply to this email or contact our support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default CustomerWelcomeEmail

// ─── Styles ───────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: EMAIL_THEME.colors.background,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
  backgroundColor: EMAIL_THEME.colors.background,
  border: `1px solid ${EMAIL_THEME.colors.border}`,
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
  color: EMAIL_THEME.colors.foreground,
}

const logoHighlight = {
  color: EMAIL_THEME.colors.primary,
}

const subHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: EMAIL_THEME.colors.primary,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginTop: "12px",
}

const contentSection = {
  padding: "32px 40px",
}

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 20px",
  lineHeight: "1.3",
}

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 24px",
}

const featureText = {
  fontSize: "16px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.textMuted,
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "20px",
  borderRadius: "8px",
  border: `1px solid ${EMAIL_THEME.colors.primary}33`,
  margin: "0 0 24px",
}

const button = {
  backgroundColor: EMAIL_THEME.colors.primary,
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 24px",
  margin: "32px 0 0",
}

const divider = {
  borderColor: EMAIL_THEME.colors.border,
  margin: "0",
}

const footerSection = {
  padding: "32px 40px 0",
  textAlign: "center" as const,
}

const footerText = {
  fontSize: "14px",
  color: EMAIL_THEME.colors.textLight,
  margin: "0 0 8px",
}
