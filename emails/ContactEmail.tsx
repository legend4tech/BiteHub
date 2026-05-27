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

interface ContactEmailProps {
  senderName: string
  senderEmail: string
  subject: string
  message: string
}

export const ContactEmail = ({
  senderName,
  senderEmail,
  subject,
  message,
}: ContactEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New contact message: {subject}</Preview>
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
            <Text style={subHeader}>New Contact Form Message</Text>
          </Section>

          <Hr style={divider} />

          {/* Message Details */}
          <Section style={contentSection}>
            <Heading style={heading}>{"You've received a new message"}</Heading>

            <div style={metaBox}>
              <Text style={metaRow}>
                <span style={metaLabel}>From:</span> {senderName}
              </Text>
              <Text style={metaRow}>
                <span style={metaLabel}>Email:</span> {senderEmail}
              </Text>
              <Text style={metaRow}>
                <span style={metaLabel}>Subject:</span> {subject}
              </Text>
            </div>

            <Text style={sectionLabel}>Message:</Text>
            <div style={messageBox}>
              <Text style={messageText}>{message}</Text>
            </div>

            <Text style={replyNote}>
              Reply directly to this email to respond to {senderName} at{" "}
              <strong>{senderEmail}</strong>.
            </Text>

            {/* ⚠️ Warning for admin — must delete quoted email before replying */}
            <div style={deleteWarning}>
              <Text style={deleteWarningText}>
                ⚠️ <strong>IMPORTANT:</strong> Before hitting Send on your
                reply, scroll down and{" "}
                <strong>DELETE everything below the dashed line</strong> (this
                notification email). If you don&apos;t, the customer will see
                this internal message in your reply.
              </Text>
            </div>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              BiteHub — Smart Food Ordering for Everyone
            </Text>
            <Text style={footerText}>
              This message was sent via the BiteHub contact form at
              bitehubapp.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ContactEmail

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

const heading = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#111827",
  marginBottom: "16px",
}

const metaBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
}

const metaRow = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#374151",
  margin: "0 0 4px 0",
}

const metaLabel = {
  fontWeight: "700",
  color: "#111827",
}

const sectionLabel = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 8px 0",
}

const messageBox = {
  backgroundColor: "#fff7ed",
  border: "1px solid #fed7aa",
  borderLeft: "4px solid #ff6b00",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
}

const messageText = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
}

const replyNote = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#6b7280",
  backgroundColor: "#f3f4f6",
  padding: "12px 16px",
  borderRadius: "8px",
  margin: "0 0 20px 0",
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

const deleteWarning = {
  backgroundColor: "#fef2f2",
  border: "2px solid #ef4444",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "0 0 20px 0",
}

const deleteWarningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#b91c1c",
  margin: "0",
}
