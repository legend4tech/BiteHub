import { Button, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface WalletTopupEmailProps {
  customerName: string
  amount: string
  newBalance: string
  reference: string
  walletUrl: string
}

export const WalletTopupEmail = ({
  customerName,
  amount,
  newBalance,
  reference,
  walletUrl,
}: WalletTopupEmailProps) => {
  return (
    <EmailLayout
      preview="Your BiteHub wallet has been funded successfully!"
      subheader="Wallet Funded"
    >
      <Heading style={heading}>Top-up Successful! 💸</Heading>
      <Text style={text}>Hi {customerName},</Text>
      <Text style={text}>
        Great news! Your BiteHub wallet has been successfully funded. You can
        now use your wallet balance to place orders seamlessly.
      </Text>
      <Section style={detailsBox}>
        <Text style={detailItem}>
          <strong>Amount Added:</strong> {amount}
        </Text>
        <Text style={detailItem}>
          <strong>New Balance:</strong> {newBalance}
        </Text>
        <Text style={detailItem}>
          <strong>Reference:</strong> {reference}
        </Text>
      </Section>
      <Button href={walletUrl} style={button}>
        View My Wallet
      </Button>
    </EmailLayout>
  )
}

export default WalletTopupEmail

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
  backgroundColor: EMAIL_THEME.colors.successBackground,
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  border: `1px solid ${EMAIL_THEME.colors.success}`,
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
