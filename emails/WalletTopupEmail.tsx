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

interface WalletTopupEmailProps {
  customerName: string
  amount: string
  newBalance: string
  reference: string
  walletUrl: string
}

export const WalletTopupEmail = ({
  customerName,
  amount,
  newBalance,
  reference,
  walletUrl,
}: WalletTopupEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your BiteHub wallet has been funded successfully!</Preview>
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
            <Text style={subHeader}>Wallet Funded</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Top-up Successful! 💸</Heading>
            <Text style={text}>
              Hi {customerName},
              <br />
              <br />
              Your BiteHub wallet has been successfully funded with{" "}
              <strong>{amount}</strong>. You are all set to order your favorite
              meals with fast, one-click checkout!
            </Text>

            <Section style={detailsContainer}>
              <Text style={detailRow}>
                <span style={detailLabel}>Amount Deposited:</span>
                <strong style={detailValue}>{amount}</strong>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>New Balance:</span>
                <strong style={detailValue}>{newBalance}</strong>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Transaction Ref:</span>
                <span style={detailValue}>{reference}</span>
              </Text>
            </Section>

            <Button href={walletUrl} style={button}>
              Go to Wallet
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

export default WalletTopupEmail

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

const detailsContainer = {
  backgroundColor: EMAIL_THEME.colors.background,
  padding: "20px",
  borderRadius: "8px",
  border: `1px solid ${EMAIL_THEME.colors.border}`,
  margin: "24px 0",
}

const detailRow = {
  margin: "0 0 12px",
  fontSize: "15px",
  display: "flex",
  justifyContent: "space-between",
  borderBottom: `1px dashed ${EMAIL_THEME.colors.border}`,
  paddingBottom: "8px",
}

const detailLabel = {
  color: EMAIL_THEME.colors.textMuted,
}

const detailValue = {
  color: EMAIL_THEME.colors.foreground,
  fontWeight: "600",
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
