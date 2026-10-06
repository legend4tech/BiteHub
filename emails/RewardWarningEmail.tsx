import { Button, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface RewardWarningEmailProps {
  customerName: string
  expiringItems: string
  rewardsUrl: string
}

export const RewardWarningEmail = ({
  customerName,
  expiringItems,
  rewardsUrl,
}: RewardWarningEmailProps) => {
  return (
    <EmailLayout
      preview="Your BiteHub rewards are expiring soon! ⏳"
      subheader="Reward Expiry Warning"
    >
      <Heading style={heading}>Use your rewards before they expire! ⏳</Heading>
      <Text style={text}>Hi {customerName},</Text>
      <Text style={text}>
        This is a quick reminder that you have BiteHub rewards expiring in less
        than 7 days.
      </Text>
      <Section style={detailsBox}>
        <Text style={detailItem}>
          <strong>Expiring Soon:</strong> {expiringItems}
        </Text>
      </Section>
      <Text style={text}>
        Don&apos;t let free food go to waste! Place an order on BiteHub today
        and apply your rewards at checkout to claim your savings.
      </Text>
      <Button href={rewardsUrl} style={button}>
        Order Now
      </Button>
    </EmailLayout>
  )
}

export default RewardWarningEmail

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
  margin: "0 0 16px 0",
}
const detailsBox = {
  backgroundColor: EMAIL_THEME.colors.destructiveBackground,
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  border: `1px solid ${EMAIL_THEME.colors.destructive}`,
}
const detailItem = {
  margin: "0 0 8px 0",
  fontSize: "15px",
  color: EMAIL_THEME.colors.foreground,
}
const button = {
  backgroundColor: EMAIL_THEME.colors.primary,
  color: EMAIL_THEME.colors.background,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-block",
  margin: "16px 0",
  textAlign: "center" as const,
  width: "100%",
}
