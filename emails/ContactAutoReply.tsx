import { Button, Section, Text, Heading, Hr } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

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
    <EmailLayout
      preview="We received your message — BiteHub Support"
      subheader="Support Team"
    >
      <Heading style={heading}>{"We've received your message 👋"}</Heading>
      <Text style={text}>Hi {senderName},</Text>
      <Text style={text}>
        Thank you for reaching out to BiteHub. This is a confirmation that we
        have received your message and our team will get back to you within{" "}
        <strong>24 hours</strong>.
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
    </EmailLayout>
  )
}

export default ContactAutoReply

const heading = {
  fontSize: "20px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  marginBottom: "16px",
}
const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 16px 0",
}
const sectionLabel = {
  fontSize: "13px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.textMuted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 8px 0",
}
const summaryBox = {
  backgroundColor: EMAIL_THEME.colors.background,
  border: `1px solid ${EMAIL_THEME.colors.border}`,
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
}
const summaryRow = {
  fontSize: "14px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 8px 0",
}
const summaryLabel = { fontWeight: "700", color: EMAIL_THEME.colors.foreground }
const summaryDivider = {
  borderColor: EMAIL_THEME.colors.border,
  margin: "8px 0",
}
const summaryMessage = {
  fontSize: "14px",
  lineHeight: "22px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0",
  whiteSpace: "pre-wrap" as const,
}
const buttonRow = { textAlign: "center" as const, margin: "24px 0" }
const primaryButton = {
  backgroundColor: EMAIL_THEME.colors.primary,
  borderRadius: "8px",
  color: EMAIL_THEME.colors.background,
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
  color: EMAIL_THEME.colors.textMuted,
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "12px 16px",
  borderRadius: "8px",
  margin: "0 0 20px 0",
}
