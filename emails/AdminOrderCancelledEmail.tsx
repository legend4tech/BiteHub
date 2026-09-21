import { Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

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
    <EmailLayout
      preview="URGENT: Order Cancelled - Manual Refund Required"
      subheader="Admin Action Required"
    >
      <Heading style={heading}>Manual Refund Required</Heading>
      <Text style={text}>
        Vendor <strong>{vendorName}</strong> has just cancelled order{" "}
        <strong>{orderId}</strong>.
      </Text>
      <Text style={text}>
        This order has been removed from the vendor&apos;s pending payouts.
        However, because Monnify automatically settles split payments, you must
        process a manual refund before the 10:30 PM settlement window closes.
      </Text>
      <Section style={detailsBox}>
        <Text style={detailText}>
          <strong>Order ID:</strong> {orderId}
        </Text>
        <Text style={detailText}>
          <strong>Vendor:</strong> {vendorName}
        </Text>
        <Text style={detailText}>
          <strong>Monnify Ref:</strong> {monnifyReference}
        </Text>
      </Section>
      <Section style={warningBox}>
        <Text style={warningText}>
          ⚠️ Action required: Log into the Monnify dashboard and initiate a
          refund for the customer before the daily settlement cutoff.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default AdminOrderCancelledEmail

const heading = {
  fontSize: "20px",
  fontWeight: "700",
  color: EMAIL_THEME.colors.foreground,
  marginBottom: "16px",
}
const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 12px 0",
}
const detailsBox = {
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
}
const detailText = {
  fontSize: "14px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 6px 0",
}
const warningBox = { margin: "16px 0" }
const warningText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: EMAIL_THEME.colors.warning,
  backgroundColor: EMAIL_THEME.colors.warningBackground,
  padding: "16px",
  borderRadius: "8px",
  border: `1px solid ${EMAIL_THEME.colors.warning}`,
}
