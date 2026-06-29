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
  Button,
} from "@react-email/components"
import * as React from "react"

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface VendorNewOrderEmailProps {
  vendorName: string
  orderId: string
  customerName: string
  customerPhone: string
  deliveryLocation: string
  items: OrderItem[]
  deliveryFee: number
  serviceFee: number
  platformCommission: number
  totalAmount: number
  vendorRevenue: number
  notes?: string
  dashboardUrl: string
}

// Inline exact formatter — no NGN CLDR stripping of kobo
const fmt = (n: number) => {
  const hasKobo = !Number.isInteger(n)
  return (
    "\u20a6" +
    new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: hasKobo ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(n)
  )
}

export const VendorNewOrderEmail = ({
  vendorName,
  orderId,
  customerName,
  customerPhone,
  deliveryLocation,
  items = [],
  deliveryFee = 0,
  serviceFee = 0,
  platformCommission = 0,
  totalAmount,
  vendorRevenue,
  notes,
  dashboardUrl,
}: VendorNewOrderEmailProps) => {
  const itemsSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <Html>
      <Head />
      <Preview>
        New order {orderId} from {customerName} — {fmt(vendorRevenue)} earnings
      </Preview>
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
            <Text style={subHeader}>New Order Alert</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Heading style={heading}>You have a new order!</Heading>
            <Text style={text}>
              Hi <strong>{vendorName}</strong>, a new order has just been placed
              and paid for on BiteHub. Here are the details:
            </Text>

            {/* Order ID pill */}
            <Section style={orderIdSection}>
              <Text style={orderIdLabel}>Order ID</Text>
              <Text style={orderIdValue}>{orderId}</Text>
            </Section>

            {/* Customer info */}
            <Section style={detailsSection}>
              <Text style={sectionTitle}>Customer Details</Text>
              <div style={infoRow}>
                <Text style={infoLabel}>Name</Text>
                <Text style={infoValue}>{customerName}</Text>
              </div>
              <div style={infoRow}>
                <Text style={infoLabel}>Phone</Text>
                <Text style={infoValue}>{customerPhone}</Text>
              </div>
              <div style={infoRow}>
                <Text style={infoLabel}>Deliver to</Text>
                <Text style={infoValue}>{deliveryLocation}</Text>
              </div>
            </Section>

            {/* Items */}
            <Section style={detailsSection}>
              <Text style={sectionTitle}>Order Items</Text>
              {items.map((item, index) => (
                <div key={index} style={itemRow}>
                  <Text style={itemText}>
                    <span style={itemQty}>{item.quantity}x</span> {item.name}
                  </Text>
                  <Text style={itemPrice}>
                    {fmt(item.price * item.quantity)}
                  </Text>
                </div>
              ))}

              <Hr style={summaryDivider} />

              <div style={summaryRow}>
                <Text style={summaryLabel}>Items subtotal</Text>
                <Text style={summaryValue}>{fmt(itemsSubtotal)}</Text>
              </div>
              {deliveryFee > 0 && (
                <div style={summaryRow}>
                  <Text style={summaryLabel}>Delivery Fee</Text>
                  <Text style={summaryValue}>{fmt(deliveryFee)}</Text>
                </div>
              )}
              {serviceFee > 0 && (
                <div style={summaryRow}>
                  <Text style={summaryLabel}>Processing Fee (Monnify)</Text>
                  <Text style={summaryValue}>{fmt(serviceFee)}</Text>
                </div>
              )}
              {platformCommission > 0 && (
                <div style={summaryRow}>
                  <Text style={summaryLabel}>Platform Commission</Text>
                  <Text style={summaryValue}>{fmt(platformCommission)}</Text>
                </div>
              )}
              <div style={summaryRow}>
                <Text style={summaryLabel}>Total charged to customer</Text>
                <Text style={summaryValue}>{fmt(totalAmount)}</Text>
              </div>

              {/* Earnings highlight */}
              <div style={earningsRow}>
                <Text style={earningsLabel}>Your earnings</Text>
                <Text style={earningsValue}>{fmt(vendorRevenue)}</Text>
              </div>
            </Section>

            {/* Notes */}
            {notes && (
              <Section style={notesSection}>
                <Text style={sectionTitle}>Customer Note</Text>
                <Text style={notesText}>{notes}</Text>
              </Section>
            )}

            <Section style={buttonContainer}>
              <Button href={dashboardUrl} style={button}>
                View Order on Dashboard
              </Button>
            </Section>

            <Text style={text}>
              Please prepare this order promptly and update its status on your
              dashboard as it progresses.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={footerText}>
              BiteHub — Order Campus Food, Fast &amp; Easy
            </Text>
            <Text style={footerText}>
              This is an automated message. Do not reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default VendorNewOrderEmail

// ─── Styles ─────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "var(--background)",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}
const container = {
  backgroundColor: "var(--card)",
  margin: "40px auto",
  padding: "0",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  maxWidth: "600px",
  overflow: "hidden",
}
const headerSection = {
  backgroundColor: "var(--primary-foreground)",
  padding: "32px 40px",
  textAlign: "center" as const,
}
const logoImg = { margin: "0 auto", display: "block" }
const logoText = {
  fontSize: "24px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: "12px 0 4px",
  color: "var(--foreground)",
}
const logoHighlight = { color: "var(--primary)" }
const subHeader = {
  fontSize: "14px",
  fontWeight: "600",
  color: "var(--primary)",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
}
const divider = { borderTop: "1px solid var(--border)", margin: "0" }
const contentSection = { padding: "40px" }
const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "var(--foreground)",
  margin: "0 0 16px",
}
const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "var(--muted-foreground)",
  margin: "0 0 16px",
}
const orderIdSection = {
  backgroundColor: "var(--primary-foreground)",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "0 0 24px",
}
const orderIdLabel = {
  fontSize: "11px",
  fontWeight: "700",
  color: "var(--primary)",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 4px",
}
const orderIdValue = {
  fontSize: "20px",
  fontWeight: "800",
  color: "var(--foreground)",
  fontFamily: "monospace",
  margin: "0",
}
const detailsSection = {
  backgroundColor: "var(--muted)",
  padding: "20px 24px",
  borderRadius: "12px",
  margin: "0 0 20px",
}
const sectionTitle = {
  fontSize: "12px",
  fontWeight: "700",
  color: "var(--muted-foreground)",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 14px",
}
const infoRow = { display: "table", width: "100%", marginBottom: "8px" }
const infoLabel = {
  display: "table-cell",
  fontSize: "14px",
  color: "var(--muted-foreground)",
  width: "110px",
  margin: "0",
}
const infoValue = {
  display: "table-cell",
  fontSize: "14px",
  color: "var(--foreground)",
  fontWeight: "600",
  margin: "0",
}
const itemRow = { display: "table", width: "100%", marginBottom: "10px" }
const itemText = {
  display: "table-cell",
  fontSize: "15px",
  color: "var(--foreground)",
  margin: "0",
}
const itemQty = {
  color: "var(--primary)",
  fontWeight: "700",
  marginRight: "4px",
}
const itemPrice = {
  display: "table-cell",
  fontSize: "15px",
  color: "var(--foreground)",
  fontWeight: "600",
  textAlign: "right" as const,
  margin: "0",
}
const summaryDivider = {
  borderTop: "1px dashed var(--border)",
  margin: "16px 0",
}
const summaryRow = { display: "table", width: "100%", marginBottom: "8px" }
const summaryLabel = {
  display: "table-cell",
  fontSize: "13px",
  color: "var(--muted-foreground)",
  margin: "0",
}
const summaryValue = {
  display: "table-cell",
  fontSize: "13px",
  color: "var(--muted-foreground)",
  textAlign: "right" as const,
  margin: "0",
}
const earningsRow = {
  display: "table",
  width: "100%",
  marginTop: "12px",
  paddingTop: "14px",
  borderTop: "2px solid var(--primary)",
}
const earningsLabel = {
  display: "table-cell",
  fontSize: "16px",
  fontWeight: "700",
  color: "var(--foreground)",
  margin: "0",
}
const earningsValue = {
  display: "table-cell",
  fontSize: "20px",
  fontWeight: "800",
  color: "var(--primary)",
  textAlign: "right" as const,
  margin: "0",
}
const notesSection = {
  backgroundColor: "var(--status-pending)",
  border: "1px solid var(--status-pending-foreground)",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "0 0 20px",
}
const notesText = {
  fontSize: "14px",
  color: "var(--status-pending-foreground)",
  margin: "0",
}
const buttonContainer = { textAlign: "center" as const, margin: "28px 0" }
const button = {
  backgroundColor: "var(--primary)",
  borderRadius: "8px",
  color: "var(--primary-foreground)",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
}
const footerSection = {
  backgroundColor: "var(--muted)",
  padding: "28px 40px",
  textAlign: "center" as const,
}
const footerText = {
  fontSize: "13px",
  color: "var(--muted-foreground)",
  margin: "0 0 6px",
}
