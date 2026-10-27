import { Link, Section, Text, Heading, Button } from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

export interface RewardSystemAlertDetail {
  label: string
  value: string
}

interface RewardSystemAlertEmailProps {
  action: string // e.g. "Reward Campaign Created", "Promo Code Modified"
  entityTitle: string // e.g. "Campus Matriculation Coins" or "MATRIC50"
  adminName: string
  adminEmail: string
  details: RewardSystemAlertDetail[]
  dashboardUrl: string
}

export const RewardSystemAlertEmail = ({
  action,
  entityTitle,
  adminName,
  adminEmail,
  details = [],
  dashboardUrl,
}: RewardSystemAlertEmailProps) => {
  return (
    <EmailLayout
      preview={`[Security Alert] ${action}: ${entityTitle}`}
      subheader="Security & Audit Notification"
    >
      <Heading style={heading}>Reward System Modification Alert</Heading>
      <Text style={text}>
        A critical modification was just applied to BiteHub&apos;s financial
        rewards / promo system.
      </Text>

      <Section style={summaryBox}>
        <Text style={summaryTitle}>
          <strong>Action:</strong> {action}
        </Text>
        <Text style={summaryItem}>
          <strong>Entity:</strong> {entityTitle}
        </Text>
        <Text style={summaryItem}>
          <strong>Performed By:</strong> {adminName || "Admin"} ({adminEmail})
        </Text>
        <Text style={summaryItem}>
          <strong>Timestamp:</strong> {new Date().toUTCString()}
        </Text>
      </Section>

      {details.length > 0 && (
        <Section style={detailsBox}>
          <Text style={detailsHeading}>Parameters Configured:</Text>
          {details.map((item, idx) => (
            <Text key={idx} style={detailRow}>
              <span style={detailLabel}>{item.label}:</span>{" "}
              <span style={detailValue}>{item.value}</span>
            </Text>
          ))}
        </Section>
      )}

      {dashboardUrl && (
        <Section style={buttonSection}>
          <Button href={dashboardUrl} style={button}>
            Review in Admin Dashboard
          </Button>
        </Section>
      )}

      <Text style={warningText}>
        <strong>Unrecognized or unauthorized change?</strong>
        <br />
        If you or your authorized staff did not make this change, a staff
        account may be compromised. Log in to your Admin Dashboard immediately
        to deactivate this reward and revoke compromised credentials. You can
        also contact core support at{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`} style={link}>
          {CONTACT_EMAIL}
        </Link>
        .
      </Text>
    </EmailLayout>
  )
}

export default RewardSystemAlertEmail

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
const summaryBox = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "16px",
  border: `1px solid ${EMAIL_THEME.colors.border}`,
}
const summaryTitle = {
  fontSize: "15px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 6px 0",
}
const summaryItem = {
  fontSize: "14px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 4px 0",
}
const detailsBox = {
  backgroundColor: EMAIL_THEME.colors.background,
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "20px",
  border: `1px solid ${EMAIL_THEME.colors.border}`,
}
const detailsHeading = {
  fontSize: "14px",
  fontWeight: "600",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 10px 0",
}
const detailRow = {
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 4px 0",
}
const detailLabel = {
  fontWeight: "600",
  color: EMAIL_THEME.colors.textMuted,
}
const detailValue = {
  color: EMAIL_THEME.colors.foreground,
}
const buttonSection = {
  textAlign: "center" as const,
  margin: "24px 0",
}
const button = {
  backgroundColor: EMAIL_THEME.colors.primary,
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
}
const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.destructive,
  backgroundColor: EMAIL_THEME.colors.destructiveBackground,
  padding: "16px",
  borderRadius: "8px",
  margin: "20px 0",
  border: `1px solid ${EMAIL_THEME.colors.destructive}`,
}
const link = { color: EMAIL_THEME.colors.primary, textDecoration: "underline" }
