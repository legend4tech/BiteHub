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
  Link,
} from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"

interface ContactAutoReplyProps {
  senderName: string
  subject: string
  message: string
}

export const ContactAutoReply = ({
  senderName,
  subject,
  message,
}: ContactAutoReplyProps) => {
  return (
    <Html>
      <Head />
      <Preview>We received your message — BiteHub Support</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
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
            <Text style={subHeader}>Support Team</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>
              {"We've received your message 👋"}
            </Heading>
            <Text style={text}>Hi {senderName},</Text>
            <Text style={text}>
              Thank you for reaching out to BiteHub. This is a confirmation that
              we have received your message and our team will get back to you
              within <strong>24 hours</strong>.
            </Text>

            {/* Summary of their message */}
            <Text style={sectionLabel}>Your message summary:</Text>
            <div style={summaryBox}>
              <Text style={summaryRow}>
                <span style={summaryLabel}>Subject:</span> {subject}
              </Text>
              <Hr style={summaryDivider} />
              <Text style={summaryMessage}>{message}</Text>
            </div>

            <Text style={text}>
              In the meantime, you can also reach us faster through WhatsApp or
              explore our platform:
            </Text>

            <Section style={buttonRow}>
              <Button style={primaryButton} href="https://bitehubapp.com">
                Visit BiteHub
              </Button>
            </Section>

            <Text style={warningText}>
              Please do not reply to this email — it is sent from an unmonitored
              address. We will reach out to you directly from{" "}
              <strong>{CONTACT_EMAIL}</strong>.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerBrand}>
              Bite<span style={footerOrange}>Hub</span> Support Team
            </Text>
            <Text style={footerText}>
              BiteHub — Smart Food Ordering for Everyone
            </Text>
            <Text style={footerText}>
              <Link href="https://bitehubapp.com" style={footerLink}>
                bitehubapp.com
              </Link>{" "}
              •{" "}
              <Link href={`mailto:{CONTACT_EMAIL}`} style={footerLink}>
                {CONTACT_EMAIL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ContactAutoReply

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

const sectionLabel = {
  fontSize: "13px",
  fontWeight: "700",
  color: "var(--muted-foreground)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 8px 0",
}

const summaryBox = {
  backgroundColor: "var(--background)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
}

const summaryRow = {
  fontSize: "14px",
  color: "#374151",
  margin: "0 0 8px 0",
}

const summaryLabel = {
  fontWeight: "700",
  color: "var(--foreground)",
}

const summaryDivider = {
  borderColor: "var(--border)",
  margin: "8px 0",
}

const summaryMessage = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "var(--muted-foreground)",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
}

const buttonRow = {
  textAlign: "center" as const,
  margin: "24px 0",
}

const primaryButton = {
  backgroundColor: "var(--primary)",
  borderRadius: "8px",
  color: "var(--card)",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 28px",
}

const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "var(--muted-foreground)",
  backgroundColor: "var(--muted)",
  padding: "12px 16px",
  borderRadius: "8px",
  margin: "0 0 20px 0",
}

const footerSection = {
  padding: "0 40px",
  textAlign: "center" as const,
}

const footerBrand = {
  fontSize: "16px",
  fontWeight: "900",
  color: "var(--foreground)",
  margin: "0 0 8px 0",
}

const footerOrange = {
  color: "var(--primary)",
}

const footerText = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "var(--muted-foreground)",
  margin: "0 0 6px 0",
}

const footerLink = {
  color: "var(--muted-foreground)",
  textDecoration: "underline",
}
