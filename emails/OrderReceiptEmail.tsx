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
  Button,
} from "@react-email/components"
import * as React from "react"
import { SUPPORT_EMAIL } from "@/lib/constants"
import { EMAIL_THEME } from "@/lib/email-theme"

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderReceiptEmailProps {
  customerName: string
  orderId: string
  vendorName: string
  totalAmount: number
  deliveryFee?: number
  serviceFee?: number
  items: OrderItem[]
  trackingUrl: string
}

export const OrderReceiptEmail = ({
  customerName,
  orderId,
  vendorName,
  totalAmount,
  deliveryFee = 0,
  serviceFee = 0,
  items = [],
  trackingUrl,
}: OrderReceiptEmailProps) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const subtotal = totalAmount - deliveryFee - serviceFee

  return (
    <Html>
      <Head />
      <Preview>Your BiteHub Receipt for Order {orderId}</Preview>
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
            <Text style={subHeader}>Order Receipt</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Payment Successful!</Heading>
            <Text style={text}>Hello {customerName},</Text>
            <Text style={text}>
              Thank you for ordering on BiteHub. Your payment for order{" "}
              <strong>{orderId}</strong> from <strong>{vendorName}</strong> has
              been confirmed securely via Monnify.
            </Text>

            <Section style={detailsSection}>
              <Text style={sectionTitle}>Order Summary</Text>

              {items.map((item, index) => (
                <div key={index} style={itemRow}>
                  <Text style={itemText}>
                    <span style={itemQty}>{item.quantity}x</span> {item.name}
                  </Text>
                  <Text style={itemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </div>
              ))}

              <Hr style={summaryDivider} />

              <div style={summaryRow}>
                <Text style={summaryLabel}>Subtotal</Text>
                <Text style={summaryValue}>{formatPrice(subtotal)}</Text>
              </div>

              {deliveryFee > 0 && (
                <div style={summaryRow}>
                  <Text style={summaryLabel}>Delivery Fee</Text>
                  <Text style={summaryValue}>{formatPrice(deliveryFee)}</Text>
                </div>
              )}

              {serviceFee > 0 && (
                <div style={summaryRow}>
                  <Text style={summaryLabel}>Service Fee</Text>
                  <Text style={summaryValue}>{formatPrice(serviceFee)}</Text>
                </div>
              )}

              <div style={totalRow}>
                <Text style={totalLabel}>Total Paid</Text>
                <Text style={totalValue}>{formatPrice(totalAmount)}</Text>
              </div>
            </Section>

            <Section style={buttonContainer}>
              <Button href={trackingUrl} style={button}>
                Track Your Order
              </Button>
            </Section>

            <Text style={text}>
              If you have any issues with your order, please contact the vendor
              directly from your tracking page or reach out to us at{" "}
              <Link href={`mailto:{SUPPORT_EMAIL}`} style={link}>
                {SUPPORT_EMAIL}
              </Link>
              .
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              BiteHub — Order Campus Food, Fast & Easy
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

export default OrderReceiptEmail

// ─── Styles ─────────────────────────────────────────────────────────────

const main = {
  backgroundColor: EMAIL_THEME.colors.background,
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: EMAIL_THEME.colors.background,
  margin: "40px auto",
  padding: "0",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  maxWidth: "600px",
  overflow: "hidden",
}

const headerSection = {
  backgroundColor: EMAIL_THEME.colors.background,
  padding: "32px 40px",
  textAlign: "center" as const,
}

const logoImg = {
  margin: "0 auto",
  display: "block",
}

const logoText = {
  fontSize: "24px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: "12px 0 4px",
  color: EMAIL_THEME.colors.foreground, // foreground
}

const logoHighlight = {
  color: EMAIL_THEME.colors.primary, // primary
}

const subHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: EMAIL_THEME.colors.primary,
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
}

const divider = {
  borderTop: `1px solid ${EMAIL_THEME.colors.border}`,
  margin: "0",
}

const contentSection = {
  padding: "40px",
}

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 24px",
}

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 16px",
}

const detailsSection = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "24px",
  borderRadius: "12px",
  margin: "32px 0",
}

const sectionTitle = {
  fontSize: "13px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.textMuted,
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 16px",
}

const itemRow = {
  display: "table",
  width: "100%",
  marginBottom: "12px",
}

const itemText = {
  display: "table-cell",
  fontSize: "15px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0",
}

const itemQty = {
  color: EMAIL_THEME.colors.primary,
  fontWeight: "600",
  marginRight: "6px",
}

const itemPrice = {
  display: "table-cell",
  fontSize: "15px",
  color: EMAIL_THEME.colors.foreground,
  fontWeight: "600",
  textAlign: "right" as const,
  margin: "0",
}

const summaryDivider = {
  borderTop: `1px dashed ${EMAIL_THEME.colors.border}`,
  margin: "16px 0",
}

const summaryRow = {
  display: "table",
  width: "100%",
  marginBottom: "8px",
}

const summaryLabel = {
  display: "table-cell",
  fontSize: "14px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0",
}

const summaryValue = {
  display: "table-cell",
  fontSize: "14px",
  color: EMAIL_THEME.colors.textMuted,
  textAlign: "right" as const,
  margin: "0",
}

const totalRow = {
  display: "table",
  width: "100%",
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: `1px solid ${EMAIL_THEME.colors.border}`,
}

const totalLabel = {
  display: "table-cell",
  fontSize: "16px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  margin: "0",
}

const totalValue = {
  display: "table-cell",
  fontSize: "18px",
  fontWeight: "800",
  color: EMAIL_THEME.colors.primary,
  textAlign: "right" as const,
  margin: "0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: EMAIL_THEME.colors.primary,
  borderRadius: "8px",
  color: EMAIL_THEME.colors.background,
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
}

const link = {
  color: EMAIL_THEME.colors.primary,
  textDecoration: "underline",
}

const footerSection = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "32px 40px",
  textAlign: "center" as const,
}

const footerText = {
  fontSize: "13px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 8px",
}

const footerLink = {
  color: EMAIL_THEME.colors.textMuted,
  textDecoration: "underline",
}
