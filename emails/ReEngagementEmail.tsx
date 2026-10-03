import { Button, Section, Text, Heading } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

interface ReEngagementEmailProps {
  customerName: string
  menusUrl: string
}

export const ReEngagementEmail = ({
  customerName,
  menusUrl,
}: ReEngagementEmailProps) => {
  return (
    <EmailLayout
      preview="Your next meal is waiting... 🍽️"
      subheader="We Miss You"
    >
      <Heading style={heading}>{customerName}, we miss you! 🍽️</Heading>
      <Text style={text}>
        It&apos;s been a while since your last order on BiteHub.
      </Text>
      <Section style={detailsBox}>
        <Text style={detailItem}>
          We&apos;ve been cooking up something for you. Log back in to see
          what&apos;s new from your favorite vendors on campus.
        </Text>
      </Section>
      <Text style={text}>
        P.S. Check your Rewards tab — there might be a new campaign waiting for
        you to claim!
      </Text>
      <Button href={menusUrl} style={button}>
        Order Now
      </Button>
    </EmailLayout>
  )
}

export default ReEngagementEmail

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
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  border: `1px solid ${EMAIL_THEME.colors.border}`,
}
const detailItem = {
  margin: "0",
  fontSize: "15px",
  lineHeight: "24px",
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
