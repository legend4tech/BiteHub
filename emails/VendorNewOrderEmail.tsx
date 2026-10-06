import { Button, Section, Text, Heading, Hr } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface OrderItem {
  name: string
  quantity: number
  priceInKobo: number
}

interface VendorNewOrderEmailProps {
  vendorName: string
  orderId: string
  customerName: string
  customerPhone: string
  deliveryLocation: string
  items: OrderItem[]
  deliveryFeeInKobo: number
  serviceFeeInKobo: number
  platformCommissionInKobo: number
  totalAmountInKobo: number
  vendorRevenueInKobo: number
  notes?: string
  dashboardUrl: string
}

import { formatKoboToNaira } from "@/lib/money"

export const VendorNewOrderEmail = ({
  vendorName,
  orderId,
  customerName,
  customerPhone,
  deliveryLocation,
  items = [],
  deliveryFeeInKobo = 0,
  platformCommissionInKobo = 0,
  vendorRevenueInKobo,
  notes,
  dashboardUrl,
}: VendorNewOrderEmailProps) => {
  const itemsSubtotal = items.reduce(
    (s, i) => s + i.priceInKobo * i.quantity,
    0
  )

  return (
    <EmailLayout
      preview={`New order ${orderId} from ${customerName} — ${formatKoboToNaira(vendorRevenueInKobo)} earnings`}
      subheader="New Order Alert"
    >
      <Heading style={heading}>You have a new order!</Heading>
      <Text style={text}>
        Hi <strong>{vendorName}</strong>, a new order has just been placed and
        paid for on BiteHub. Here are the details:
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
              {formatKoboToNaira(item.priceInKobo * item.quantity)}
            </Text>
          </div>
        ))}

        <Hr style={summaryDivider} />

        <div style={summaryRow}>
          <Text style={summaryLabel}>Items subtotal</Text>
          <Text style={summaryValue}>{formatKoboToNaira(itemsSubtotal)}</Text>
        </div>
        {deliveryFeeInKobo > 0 && (
          <div style={summaryRow}>
            <Text style={summaryLabel}>Delivery Fee</Text>
            <Text style={summaryValue}>
              {formatKoboToNaira(deliveryFeeInKobo)}
            </Text>
          </div>
        )}
        {platformCommissionInKobo > 0 && (
          <div style={summaryRow}>
            <Text style={summaryLabel}>Platform Commission</Text>
            <Text style={summaryValue}>
              {formatKoboToNaira(platformCommissionInKobo)}
            </Text>
          </div>
        )}

        {/* Earnings highlight */}
        <div style={earningsRow}>
          <Text style={earningsLabel}>Your earnings</Text>
          <Text style={earningsValue}>
            {formatKoboToNaira(vendorRevenueInKobo)}
          </Text>
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
    </EmailLayout>
  )
}

export default VendorNewOrderEmail

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 16px",
}
const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 16px",
}
const orderIdSection = {
  backgroundColor: EMAIL_THEME.colors.background,
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "0 0 24px",
}
const orderIdLabel = {
  fontSize: "11px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.primary,
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 4px",
}
const orderIdValue = {
  fontSize: "20px",
  fontWeight: "800",
  color: EMAIL_THEME.colors.foreground,
  fontFamily: "monospace",
  margin: "0",
}
const detailsSection = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  padding: "20px 24px",
  borderRadius: "12px",
  margin: "0 0 20px",
}
const sectionTitle = {
  fontSize: "12px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.textMuted,
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 14px",
}
const infoRow = { display: "table", width: "100%", marginBottom: "8px" }
const infoLabel = {
  display: "table-cell",
  fontSize: "14px",
  color: EMAIL_THEME.colors.textMuted,
  width: "110px",
  margin: "0",
}
const infoValue = {
  display: "table-cell",
  fontSize: "14px",
  color: EMAIL_THEME.colors.foreground,
  fontWeight: "600",
  margin: "0",
}
const itemRow = { display: "table", width: "100%", marginBottom: "10px" }
const itemText = {
  display: "table-cell",
  fontSize: "15px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0",
}
const itemQty = {
  color: EMAIL_THEME.colors.primary,
  fontWeight: "700",
  marginRight: "4px",
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
const summaryRow = { display: "table", width: "100%", marginBottom: "8px" }
const summaryLabel = {
  display: "table-cell",
  fontSize: "13px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0",
}
const summaryValue = {
  display: "table-cell",
  fontSize: "13px",
  color: EMAIL_THEME.colors.textMuted,
  textAlign: "right" as const,
  margin: "0",
}
const earningsRow = {
  display: "table",
  width: "100%",
  marginTop: "12px",
  paddingTop: "14px",
  borderTop: `2px solid ${EMAIL_THEME.colors.primary}`,
}
const earningsLabel = {
  display: "table-cell",
  fontSize: "16px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  margin: "0",
}
const earningsValue = {
  display: "table-cell",
  fontSize: "20px",
  fontWeight: "800",
  color: EMAIL_THEME.colors.primary,
  textAlign: "right" as const,
  margin: "0",
}
const notesSection = {
  backgroundColor: `${EMAIL_THEME.colors.warningBackground}`,
  border: `1px solid ${EMAIL_THEME.colors.warning}`,
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "0 0 20px",
}
const notesText = {
  fontSize: "14px",
  color: `${EMAIL_THEME.colors.warning}`,
  margin: "0",
}
const buttonContainer = { textAlign: "center" as const, margin: "28px 0" }
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
