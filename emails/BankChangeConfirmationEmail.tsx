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
} from "@react-email/components"
import * as React from "react"
import { CONTACT_EMAIL } from "@/lib/constants"

interface BankChangeConfirmationEmailProps {
  vendorName: string
  bankName: string
  accountNumber: string
  lockDays: number
}

export const BankChangeConfirmationEmail = ({
  vendorName,
  bankName,
  accountNumber,
  lockDays,
}: BankChangeConfirmationEmailProps) => {
  // Mask account number to show only last 4 digits
  const maskedAccount =
    accountNumber.length > 4
      ? `******${accountNumber.slice(-4)}`
      : accountNumber

  return (
    <Html>
      <Head />
      <Preview>Your BiteHub Payout Bank Details Were Updated</Preview>
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
            <Text style={subHeader}>Bank Details Updated</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>
              Payout Account Updated Successfully
            </Heading>
            <Text style={text}>Hello {vendorName || "Vendor"},</Text>
            <Text style={text}>
              You have successfully updated your bank account for receiving
              payouts on BiteHub.
            </Text>

            <Section style={detailsSection}>
              <Text style={detailText}>
                <strong>New Bank Name:</strong> {bankName}
              </Text>
              <Text style={detailText}>
                <strong>New Account Number:</strong> {maskedAccount}
              </Text>
            </Section>

            <Text style={warningText}>
              <strong>Security Lock Active</strong>
              <br />
              To protect your funds, you cannot change these bank details again
              for the next <strong>{lockDays} days</strong>. After this period,
              any changes will require an email verification code.
            </Text>

            <Text style={text}>
              If you did not authorize this change, your account may be
              compromised. Please contact support immediately at{" "}
              <Link href={`mailto:{CONTACT_EMAIL}`} style={link}>
                {CONTACT_EMAIL}
              </Link>
              .
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              BiteHub — Smart Food Ordering for Everyone
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

export default BankChangeConfirmationEmail

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

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 16px 0",
}

const detailsSection = {
  backgroundColor: "#f3f4f6",
  padding: "16px",
  borderRadius: "8px",
  margin: "16px 0",
}

const detailText = {
  fontSize: "15px",
  margin: "0 0 8px 0",
  color: "#111827",
}

const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#047857",
  backgroundColor: "#d1fae5",
  padding: "16px",
  borderRadius: "8px",
  margin: "20px 0",
  border: "1px solid #a7f3d0",
}

const link = {
  color: "#ff6b00",
  textDecoration: "underline",
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

const footerLink = {
  color: "#9ca3af",
  textDecoration: "underline",
}
