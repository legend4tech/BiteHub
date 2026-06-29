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
} from "@react-email/components"
import * as React from "react"

interface CustomerOrderCancelledEmailProps {
  customerName: string
  orderId: string
  vendorName: string
}

export const CustomerOrderCancelledEmail = ({
  customerName,
  orderId,
  vendorName,
}: CustomerOrderCancelledEmailProps) => {
  const reorderUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"}/menus`

  return (
    <Html>
      <Head />
      <Preview>
        Your BiteHub order {orderId} was cancelled — payment not received
      </Preview>
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
            <Text style={subHeader}>Order Cancelled</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              Unfortunately, your order <strong>{orderId}</strong> from{" "}
              <strong>{vendorName}</strong> has been automatically cancelled
              because payment was not completed before the end of the day.
            </Text>

            <Section style={infoBox}>
              <Text style={infoHeading}>Why was my order cancelled?</Text>
              <Text style={infoDesc}>
                Orders that are not paid for by 11:55 PM are automatically
                cancelled to keep vendor dashboards clean and inventory
                accurate. No money was charged — your payment session expired.
              </Text>
            </Section>

            <Text style={text}>
              Want to order again? Simply visit the vendor&apos;s menu and place
              a new order. The whole process takes less than a minute!
            </Text>

            <Button href={reorderUrl} style={button}>
              Browse Menus
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>BiteHub Support Team</Text>
            <Text style={footerText}>
              Need help? Reply to this email or contact us via the app.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default CustomerOrderCancelledEmail

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

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 16px 0",
}

const infoBox = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
}

const infoHeading = {
  margin: "0 0 8px 0",
  fontSize: "14px",
  fontWeight: "bold",
  color: "var(--status-pending-foreground)",
}

const infoDesc = {
  margin: "0",
  fontSize: "14px",
  lineHeight: "22px",
  color: "#78350f",
}

const button = {
  backgroundColor: "var(--primary)",
  color: "var(--primary-foreground)",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  margin: "16px 0",
  textAlign: "center" as const,
  width: "100%",
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
