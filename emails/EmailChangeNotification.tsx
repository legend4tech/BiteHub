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
} from "@react-email/components";
import * as React from "react";

interface EmailChangeNotificationProps {
  vendorName: string;
}

export const EmailChangeNotification = ({
  vendorName,
}: EmailChangeNotificationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Security Alert: Email change requested for your BiteHub account</Preview>
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
            <Heading style={heading}>Email Change Requested</Heading>
            <Text style={text}>Hello {vendorName || "Vendor"},</Text>
            <Text style={text}>
              We received a request to change the login email address for your BiteHub vendor account.
            </Text>
            <Text style={text}>
              A confirmation link has been sent to the new email address. Your login email will not change until that link is clicked.
            </Text>

            <Text style={warningText}>
              <strong>Didn't request this?</strong>
              <br />
              If you did not initiate this change, your account may be compromised. Please contact support immediately at <Link href="mailto:contact@bitehubapp.com" style={link}>contact@bitehubapp.com</Link> and change your password.
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
  );
};

export default EmailChangeNotification;

// ─── Styles ───────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  marginTop: "40px",
  overflow: "hidden",
};

const headerSection = {
  padding: "32px 40px 10px 40px",
  textAlign: "center" as const,
};

const logoImg = {
  borderRadius: "12px",
  margin: "0 auto 12px auto",
  display: "block",
};

const logoText = {
  margin: "0",
  fontSize: "28px",
  fontWeight: "900",
  letterSpacing: "-0.05em",
  color: "#111827",
};

const logoHighlight = {
  color: "#ff6b00",
};

const subHeader = {
  margin: "4px 0 0 0",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#6b7280",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const contentSection = {
  padding: "0 40px",
};

const heading = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#111827",
  marginBottom: "16px",
};

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 16px 0",
};

const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#991b1b",
  backgroundColor: "#fef2f2",
  padding: "16px",
  borderRadius: "8px",
  margin: "20px 0",
  border: "1px solid #fecaca"
};

const link = {
  color: "#ff6b00",
  textDecoration: "underline",
};

const footerSection = {
  padding: "0 40px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#9ca3af",
  margin: "0 0 6px 0",
};

const footerLink = {
  color: "#9ca3af",
  textDecoration: "underline",
};
