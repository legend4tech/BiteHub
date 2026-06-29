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

interface VendorWelcomeEmailProps {
  vendorName: string
  email: string
  passwordPlain: string
  dashboardUrl: string
}

export const VendorWelcomeEmail = ({
  vendorName,
  email,
  passwordPlain,
  dashboardUrl,
}: VendorWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to BiteHub! Here are your login details.</Preview>
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
            <Text style={subHeader}>Vendor Account Created</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Welcome aboard, {vendorName}! 🎉</Heading>
            <Text style={text}>
              Your BiteHub vendor account has been successfully created by an
              administrator. You can now log in to manage your store, upload
              your menu, and start receiving orders.
            </Text>

            <Section style={credentialsBox}>
              <Text style={credentialsHeading}>Your Login Credentials</Text>
              <Text style={credentialItem}>
                <strong>Email:</strong> {email}
              </Text>
              <Text style={credentialItem}>
                <strong>Temporary Password:</strong> {passwordPlain}
              </Text>
            </Section>

            <Text style={warningText}>
              <strong>⚠️ Important Next Steps:</strong>
              <br />
              <br />
              1. <strong>Change your password:</strong> Please log in and change
              your temporary password immediately from your Profile Settings.
              <br />
              <br />
              2. <strong>Set up your menu:</strong> Navigate to the Menu section
              to add your items, prices, and categories so customers can start
              ordering.
              <br />
              <br />
              3. <strong>Bank Details:</strong> Don&apos;t forget to set up your
              payout bank details in settings so you can receive your funds!
            </Text>

            <Button href={dashboardUrl} style={button}>
              Log In to Vendor Dashboard
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>BiteHub Vendor Success Team</Text>
            <Text style={footerText}>
              Need help? Reply to this email or contact our support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default VendorWelcomeEmail

// ─── Styles ───────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "var(--background)",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
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
  color: "var(--foreground)",
}

const logoHighlight = {
  color: "var(--primary)",
}

const subHeader = {
  margin: "4px 0 0 0",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "var(--muted-foreground)",
}

const divider = {
  borderColor: "var(--border)",
  margin: "20px 0",
}

const contentSection = {
  padding: "0 40px",
}

const heading = {
  fontSize: "20px",
  fontWeight: "700",
  color: "var(--foreground)",
  marginBottom: "16px",
}

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 16px 0",
}

const credentialsBox = {
  backgroundColor: "var(--muted)",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  border: "1px dashed #d1d5db",
}

const credentialsHeading = {
  margin: "0 0 12px 0",
  fontSize: "16px",
  fontWeight: "bold",
  color: "var(--foreground)",
}

const credentialItem = {
  margin: "0 0 8px 0",
  fontSize: "15px",
  color: "#374151",
}

const warningText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "var(--status-pending-foreground)",
  backgroundColor: "var(--status-pending)",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  border: "1px solid var(--status-pending-foreground)",
}

const button = {
  backgroundColor: "var(--foreground)",
  color: "var(--primary-foreground)",
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
  color: "var(--muted-foreground)",
  margin: "0 0 6px 0",
}
