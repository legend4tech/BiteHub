import { Button, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface RewardEarnedEmailProps {
  customerName: string
  rewardDescription: string
  rewardAmount: string
  rewardsUrl: string
}

export const RewardEarnedEmail = ({
  customerName,
  rewardDescription,
  rewardAmount,
  rewardsUrl,
}: RewardEarnedEmailProps) => {
  return (
    <EmailLayout
      preview="You just earned a reward on BiteHub! 🎁"
      subheader="Reward Earned"
    >
      <Heading style={heading}>You Earned a Reward! 🎁</Heading>
      <Text style={text}>Hi {customerName},</Text>
      <Text style={text}>
        Great news! You just earned a reward for participating in our loyalty
        campaigns.
      </Text>
      <Section style={detailsBox}>
        <Text style={detailItem}>
          <strong>Reward:</strong> {rewardAmount}
        </Text>
        <Text style={detailItem}>
          <strong>Campaign:</strong> {rewardDescription}
        </Text>
      </Section>
      <Text style={text}>
        You can check your total BiteHub Coins (BHC) and active vouchers in your
        rewards dashboard.
      </Text>
      <Button href={rewardsUrl} style={button}>
        View My Rewards
      </Button>
    </EmailLayout>
  )
}

export default RewardEarnedEmail

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
  backgroundColor: EMAIL_THEME.colors.primaryLight,
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  border: `1px solid ${EMAIL_THEME.colors.primary}`,
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
