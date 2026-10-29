import { Section, Text, Heading, Button } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"
import { formatKoboToNaira } from "@/lib/money"
import type { OrderAttentionItem } from "./AdminOrderAttentionEmail"

export interface VendorOrderReminderEmailProps {
  orderId: string
  tier: 1 | 2 | 3
  elapsedMinutes: number
  currentStatus?: string
  vendorName: string
  customerName: string
  deliveryLocation: string
  items: OrderAttentionItem[]
  vendorRevenueInKobo: number
  vendorDashboardUrl: string
}

export const VendorOrderReminderEmail = ({
  orderId,
  tier = 1,
  elapsedMinutes,
  currentStatus,
  vendorName,
  customerName,
  deliveryLocation,
  items = [],
  vendorRevenueInKobo,
  vendorDashboardUrl,
}: VendorOrderReminderEmailProps) => {
  const isReady = (currentStatus || "").toLowerCase() === "ready"

  const tierMeta = {
    1: {
      badge: isReady
        ? "🛵 Dispatch & Delivery Required"
        : "🍳 Kitchen Action Required",
      badgeBg: EMAIL_THEME.colors.warningBackground,
      badgeColor: EMAIL_THEME.colors.warning,
      title: isReady
        ? "Meal Prepared — Please Dispatch / Deliver to Student"
        : "New Paid Order Awaiting Preparation",
      subtext: isReady
        ? `Order #${orderId} was marked Ready ${elapsedMinutes} minutes ago and is awaiting delivery to ${deliveryLocation}. Please ensure your runner has dispatched this meal to the student's location, or click below to mark it as Completed if already delivered!`
        : `Order #${orderId} was paid ${elapsedMinutes} minutes ago and is waiting for your kitchen to confirm and start preparing.`,
    },
    2: {
      badge: isReady
        ? "🛵 Delivery Update Required"
        : "⏰ Customer Waiting Reminder",
      badgeBg: EMAIL_THEME.colors.warningBackground,
      badgeColor: EMAIL_THEME.colors.warning,
      title: isReady
        ? "Student Waiting for Delivery"
        : "Fulfillment Update Needed",
      subtext: isReady
        ? `Order #${orderId} has been ready for ${elapsedMinutes} minutes. The student is waiting for delivery at ${deliveryLocation}. Please deliver the order or mark it Completed.`
        : `Order #${orderId} has been waiting for ${elapsedMinutes} minutes. The customer is eagerly tracking their food on campus.`,
    },
    3: {
      badge: "🚨 Urgent: 1 Hour Without Completion",
      badgeBg: EMAIL_THEME.colors.destructiveBackground,
      badgeColor: EMAIL_THEME.colors.destructive,
      title: "Immediate Action Required",
      subtext: isReady
        ? `Order #${orderId} has been awaiting completion for over 1 HOUR after preparation. Please ensure delivery to ${deliveryLocation} is completed, mark it Completed, or contact BiteHub Support.`
        : `Order #${orderId} has been awaiting completion for over 1 HOUR. Please update the order status or contact BiteHub Vendor Support immediately.`,
    },
  }[tier]

  return (
    <EmailLayout
      preview={`Reminder: Order #${orderId} is waiting (${elapsedMinutes}m elapsed)`}
      subheader="Kitchen Order Reminder"
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
      <Text style={text}>
        Hi <strong>{vendorName}</strong>, {tierMeta.subtext}
      </Text>

      {/* Prominent Delivery Completion Notice */}
      <Section style={deliveredCallout}>
        <Text style={deliveredHeading}>🛵 Already Prepared & Delivered?</Text>
        <Text style={deliveredText}>
          If you have already handed this meal to the student or delivery
          dispatch, please click the button below to mark it as{" "}
          <strong>&quot;Completed&quot;</strong> in your dashboard so your
          payout can be disbursed without delay!
        </Text>
      </Section>

      {/* Order Summary Box */}
      <Section style={detailsCard}>
        <Text style={detailRow}>
          <strong>Order ID:</strong> #{orderId}
        </Text>
        <Text style={detailRow}>
          <strong>Time Elapsed:</strong> {elapsedMinutes} minutes
        </Text>
        <Text style={detailRow}>
          <strong>Customer:</strong> {customerName}
        </Text>
        <Text style={detailRow}>
          <strong>Delivery Location:</strong> {deliveryLocation}
        </Text>
        {vendorRevenueInKobo > 0 && (
          <Text style={detailRow}>
            <strong>Your Payout for this Order:</strong>{" "}
            {formatKoboToNaira(vendorRevenueInKobo)}
          </Text>
        )}
      </Section>

      {/* Items Section */}
      {items.length > 0 && (
        <Section style={itemsCard}>
          <Text style={itemsHeading}>Items to Prepare ({items.length})</Text>
          {items.map((item, idx) => (
            <Text key={idx} style={itemText}>
              • <strong>{item.quantity}x</strong> {item.name}
            </Text>
          ))}
        </Section>
      )}

      {/* Action Button */}
      <Section style={actionContainer}>
        <Button style={primaryButton} href={vendorDashboardUrl}>
          Open Dashboard & Update Status
        </Button>
      </Section>
    </EmailLayout>
  )
}

export default VendorOrderReminderEmail

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

const deliveredCallout = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #86efac",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
}

const deliveredHeading = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#166534",
  margin: "0 0 6px 0",
}

const deliveredText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#15803d",
  margin: 0,
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
  padding: "12px 28px",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "14px",
  textDecoration: "none",
  display: "inline-block",
}
