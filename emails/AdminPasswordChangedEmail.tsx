import {
  Body,
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

interface AdminPasswordChangedEmailProps {
  adminName: string
  email: string
}

export const AdminPasswordChangedEmail = ({
  adminName,
  email,
}: AdminPasswordChangedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Security Alert: Admin Password Changed</Preview>
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
            <Text style={subHeader}>Security Alert</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Admin Password Changed</Heading>
            <Text style={text}>Hi {adminName || "Admin"},</Text>
            <Text style={text}>
              The password for your BiteHub Admin account (
              <strong>{email}</strong>) was just changed.
            </Text>
            <Text style={text}>
              If you made this change, you can safely ignore this email.
            </Text>

            <Text style={warningText}>
              <strong>{"Didn't make this change?"}</strong>
              <br />
              If you did NOT make this change, please contact your security team
              or reset your password immediately.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>BiteHub Security Team</Text>
            <Text style={footerText}>
              This is an automated security message. Please do not reply.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default AdminPasswordChangedEmail

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

const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "var(--status-cancelled-foreground)",
  backgroundColor: "var(--status-cancelled)",
  padding: "16px",
  borderRadius: "8px",
  margin: "20px 0",
  border: "1px solid var(--status-cancelled-foreground)",
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
