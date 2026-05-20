import {
  Body,
  Button,
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

interface ResetPasswordEmailProps {
  vendorName: string;
  resetLink: string;
  expiryMinutes: number;
}

export const ResetPasswordEmail = ({
  vendorName,
  resetLink,
  expiryMinutes,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your BiteHub vendor account password</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo / Header */}
          <Section style={headerSection}>
            {/* Inline logo image — hosted on your domain */}
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
            <Text style={subHeader}>Vendor Account</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Password Reset Request</Heading>
            <Text style={text}>Hello {vendorName || "Vendor"},</Text>
            <Text style={text}>
              We received a request to reset the password for your BiteHub vendor
              account. Click the button below to create a new password:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={resetLink}>
                Reset My Password
              </Button>
            </Section>

            <Text style={text}>
              Or copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>
              <Link href={resetLink} style={link}>
                {resetLink}
              </Link>
            </Text>

            <Text style={warningText}>
              ⏱ This link expires in <strong>{expiryMinutes} minutes</strong>. If
              you did not request a password reset, you can safely ignore this
              email — your password will remain unchanged.
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

export default ResetPasswordEmail;

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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#ff6b00",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 28px",
};

const linkText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#ff6b00",
  margin: "0 0 24px 0",
  wordBreak: "break-all" as const,
};

const link = {
  color: "#ff6b00",
  textDecoration: "underline",
};

const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#6b7280",
  backgroundColor: "#f3f4f6",
  padding: "16px",
  borderRadius: "8px",
  margin: "0 0 20px 0",
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
