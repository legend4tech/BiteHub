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

interface AdminOrderCancelledEmailProps {
  orderId: string
  vendorName: string
  monnifyReference: string
}

export const AdminOrderCancelledEmail = ({
  orderId,
  vendorName,
  monnifyReference,
}: AdminOrderCancelledEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>URGENT: Order Cancelled - Manual Refund Required</Preview>
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
            <Text style={subHeader}>Admin Action Required</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Manual Refund Required</Heading>
            <Text style={text}>
              Vendor <strong>{vendorName}</strong> has just cancelled order{" "}
              <strong>{orderId}</strong>.
            </Text>
            <Text style={text}>
              This order has been removed from the vendor&apos;s pending
              payouts. However, because Monnify automatically settles split
              payments, you must process a manual refund before the 10:30 PM
              settlement cycle to prevent the vendor from receiving the funds.
            </Text>

            <Text style={warningText}>
              <strong>Action Required Before 10:30 PM:</strong>
              <br />
              <br />
              1. Log into your Monnify Dashboard.
              <br />
              2. Search for the transaction using this reference:
              <br />
              <strong
                style={{
                  fontSize: "16px",
                  display: "block",
                  marginTop: "8px",
                  marginBottom: "8px",
                  color: "#111827",
                }}
              >
                {monnifyReference || "N/A (Check BiteHub Admin Dashboard)"}
              </strong>
              3. Click the &quot;Refund&quot; button to return the money to the
              customer.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>BiteHub Automated Alert System</Text>
            <Text style={footerText}>
              This is an automated system message. Please do not reply.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default AdminOrderCancelledEmail

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

const warningText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#991b1b",
  backgroundColor: "#fef2f2",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  border: "1px solid #fecaca",
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
