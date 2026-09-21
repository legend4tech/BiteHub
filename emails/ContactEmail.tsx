import { Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

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
    <EmailLayout
      preview={`New contact message: ${subject}`}
      subheader="New Contact Form Message"
    >
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
          ⚠️ <strong>IMPORTANT:</strong> Before hitting Send on your reply,
          scroll down and{" "}
          <strong>DELETE everything below the dashed line</strong> (this
          notification email). If you don&apos;t, the customer will see this
          internal message in your reply.
        </Text>
      </div>
    </EmailLayout>
  )
}

export default ContactEmail

const heading = {
  fontSize: "20px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  marginBottom: "16px",
}
const metaBox = {
  backgroundColor: EMAIL_THEME.colors.background,
  border: `1px solid ${EMAIL_THEME.colors.border}`,
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
}
const metaRow = {
  fontSize: "14px",
  lineHeight: "22px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 4px 0",
}
const metaLabel = { fontWeight: "700", color: EMAIL_THEME.colors.foreground }
const sectionLabel = {
  fontSize: "13px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.textMuted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 8px 0",
}
const messageBox = {
  backgroundColor: `${EMAIL_THEME.colors.background}7ed`,
  border: "1px solid #fed7aa",
  borderLeft: `4px solid ${EMAIL_THEME.colors.primary}`,
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
}
const messageText = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0",
  whiteSpace: "pre-wrap" as const,
}
const replyNote = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.textMuted,
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "12px 16px",
  borderRadius: "8px",
  margin: "0 0 20px 0",
}
const deleteWarning = {
  backgroundColor: `${EMAIL_THEME.colors.destructiveBackground}`,
  border: "2px solid #ef4444",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "0 0 20px 0",
}
const deleteWarningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: `${EMAIL_THEME.colors.destructive}`,
  margin: "0",
}
