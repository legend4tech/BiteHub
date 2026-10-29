import { Section, Text, Heading, Button, Hr } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"
import { formatKoboToNaira } from "@/lib/money"

export interface OrderAttentionItem {
  name: string
  quantity: number
  priceInKobo: number
}

export interface AdminOrderAttentionEmailProps {
  orderId: string
  tier: 1 | 2 | 3
  elapsedMinutes: number
  currentStatus: string
  vendorName: string
  vendorWhatsappNumber?: string
  customerName: string
  customerPhone: string
  deliveryLocation: string
  items: OrderAttentionItem[]
  totalAmountInKobo: number
  adminDashboardUrl: string
}

export const AdminOrderAttentionEmail = ({
  orderId,
  tier = 1,
  elapsedMinutes,
  currentStatus,
  vendorName,
  vendorWhatsappNumber,
  customerName,
  customerPhone,
  deliveryLocation,
  items = [],
  totalAmountInKobo,
  adminDashboardUrl,
}: AdminOrderAttentionEmailProps) => {
  const cleanWhatsapp = (vendorWhatsappNumber || "").replace(/\D/g, "")
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp.startsWith("0") ? "234" + cleanWhatsapp.slice(1) : cleanWhatsapp}?text=Hello%20${encodeURIComponent(vendorName)},%20we%20noticed%20order%20${encodeURIComponent(orderId)}%20has%20been%20waiting%20for%20${elapsedMinutes}%20minutes.%20Please%20update%20the%20status%20on%20BiteHub.`
    : null

  const isReady = (currentStatus || "").toLowerCase() === "ready"

  const tierMeta = {
    1: {
      badge: "⚠️ 10-Minute Early Warning",
      badgeBg: EMAIL_THEME.colors.warningBackground,
      badgeColor: EMAIL_THEME.colors.warning,
      title: isReady
        ? "Paid Order Ready — Awaiting Vendor Campus Delivery"
        : "Paid Order Waiting for Preparation",
      description: isReady
        ? `Order #${orderId} was marked Ready ${elapsedMinutes} minutes ago and is awaiting vendor dispatch to ${deliveryLocation}. Please ensure vendor delivers to the student.`
        : `Order #${orderId} was paid ${elapsedMinutes} minutes ago and is currently "${currentStatus}". Please monitor vendor response.`,
    },
    2: {
      badge: "🚨 20-Minute Escalation Alert",
      badgeBg: EMAIL_THEME.colors.warningBackground,
      badgeColor: EMAIL_THEME.colors.warning,
      title: isReady
        ? "Delivery Delay Detected (Prepared Meal)"
        : "Fulfillment Delay Detected",
      description: isReady
        ? `Order #${orderId} has been in "ready" status for ${elapsedMinutes} minutes awaiting vendor delivery to ${deliveryLocation}. Please contact vendor to dispatch/complete delivery.`
        : `Order #${orderId} has been awaiting fulfillment for ${elapsedMinutes} minutes. Please reach out to the vendor to expedite preparation.`,
    },
    3: {
      badge: "🔥 1-Hour Critical Delayed Order",
      badgeBg: EMAIL_THEME.colors.destructiveBackground,
      badgeColor: EMAIL_THEME.colors.destructive,
      title: "Immediate Manager Action Required",
      description: `Order #${orderId} has exceeded 1 HOUR without being marked completed. Immediate operations intervention or customer contact required.`,
    },
  }[tier]

  return (
    <EmailLayout
      preview={`[OPS ALERT] Order #${orderId} delayed ${elapsedMinutes}m (${vendorName})`}
      subheader="Operations Watchdog Alert"
    >
      <Section style={{ marginBottom: "16px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: tierMeta.badgeBg,
            color: tierMeta.badgeColor,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {tierMeta.badge}
        </span>
      </Section>

      <Heading style={heading}>{tierMeta.title}</Heading>
      <Text style={text}>{tierMeta.description}</Text>

      {/* Order Info Card */}
      <Section style={detailsCard}>
        <Text style={detailRow}>
          <strong>Order ID:</strong> #{orderId}
        </Text>
        <Text style={detailRow}>
          <strong>Elapsed Time:</strong> {elapsedMinutes} minutes
        </Text>
        <Text style={detailRow}>
          <strong>Current Status:</strong>{" "}
          <span style={{ textTransform: "capitalize", fontWeight: "600" }}>
            {currentStatus}
          </span>
        </Text>
        <Text style={detailRow}>
          <strong>Total Paid:</strong> {formatKoboToNaira(totalAmountInKobo)}
        </Text>
        <Hr style={divider} />
        <Text style={detailRow}>
          <strong>Vendor:</strong> {vendorName}
        </Text>
        {vendorWhatsappNumber && (
          <Text style={detailRow}>
            <strong>Vendor WhatsApp:</strong> {vendorWhatsappNumber}
          </Text>
        )}
        <Hr style={divider} />
        <Text style={detailRow}>
          <strong>Customer:</strong> {customerName} ({customerPhone})
        </Text>
        <Text style={detailRow}>
          <strong>Delivery Location:</strong> {deliveryLocation}
        </Text>
      </Section>

      {/* Items Section */}
      {items.length > 0 && (
        <Section style={itemsCard}>
          <Text style={itemsHeading}>Ordered Items ({items.length})</Text>
          {items.map((item, idx) => (
            <Text key={idx} style={itemText}>
              • {item.quantity}x {item.name} (
              {formatKoboToNaira(item.priceInKobo * item.quantity)})
            </Text>
          ))}
        </Section>
      )}

      {/* Action Buttons */}
      <Section style={actionContainer}>
        <Button style={primaryButton} href={adminDashboardUrl}>
          Open in Admin Dashboard
        </Button>
        {whatsappUrl && (
          <Button style={whatsappButton} href={whatsappUrl}>
            Contact Vendor via WhatsApp
          </Button>
        )}
      </Section>
    </EmailLayout>
  )
}

export default AdminOrderAttentionEmail

const heading = {
  fontSize: "20px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 12px 0",
}

const text = {
  fontSize: "14px",
  lineHeight: "22px",
  color: EMAIL_THEME.colors.textMuted,
  margin: "0 0 16px 0",
}

const detailsCard = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
}

const detailRow = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 4px 0",
}

const divider = {
  borderColor: "#fed7aa",
  margin: "10px 0",
}

const itemsCard = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "14px 16px",
  margin: "16px 0",
}

const itemsHeading = {
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  color: EMAIL_THEME.colors.textLight,
  margin: "0 0 8px 0",
}

const itemText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 4px 0",
}

const actionContainer = {
  marginTop: "24px",
  textAlign: "center" as const,
}

const primaryButton = {
  backgroundColor: EMAIL_THEME.colors.primary,
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "14px",
  textDecoration: "none",
  display: "inline-block",
  marginRight: "8px",
  marginBottom: "8px",
}

const whatsappButton = {
  backgroundColor: "#25D366",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "14px",
  textDecoration: "none",
  display: "inline-block",
  marginBottom: "8px",
}
