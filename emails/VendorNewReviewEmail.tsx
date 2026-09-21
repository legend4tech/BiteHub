import { Button, Section, Text } from "@react-email/components"
import * as React from "react"
import { EMAIL_THEME } from "@/lib/email-theme"
import { EmailLayout } from "./EmailLayout"

export interface EmailItemReview {
  itemName: string
  rating: number
  title?: string
  comments?: string
}

interface VendorNewReviewEmailProps {
  vendorName: string
  vendorRating: number
  itemReviews?: EmailItemReview[]
  dashboardUrl: string
}

export const VendorNewReviewEmail = ({
  vendorName = "Vendor",
  vendorRating = 5,
  itemReviews = [],
  dashboardUrl = "https://bitehubapp.com/vendor/feedback",
}: VendorNewReviewEmailProps) => {
  return (
    <EmailLayout
      preview="You received a new rating on BiteHub!"
      subheader="New Customer Review"
    >
      <Text style={text}>Hello {vendorName},</Text>
      <Text style={text}>
        Great news! A customer just left a new review for their recent order.
      </Text>

      <Section style={alertSection}>
        <Text style={alertText}>
          <strong>Service Rating:</strong> {vendorRating}/5
        </Text>
      </Section>

      {itemReviews.length > 0 && (
        <Section style={itemsSection}>
          <Text style={itemsTitle}>Item Feedback:</Text>
          {itemReviews.map((item, idx) => (
            <Section key={idx} style={itemCard}>
              <Text style={itemName}>
                {item.itemName}{" "}
                <span style={itemRating}>({item.rating}/5)</span>
              </Text>
              {item.title && (
                <Text style={itemReviewTitle}>&quot;{item.title}&quot;</Text>
              )}
              {item.comments && (
                <Text style={itemReviewComments}>{item.comments}</Text>
              )}
            </Section>
          ))}
        </Section>
      )}

      <Text style={text}>
        Log into your vendor dashboard to see all your customer feedback and
        learn how you can continue to improve your service.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          View All Reviews
        </Button>
      </Section>
    </EmailLayout>
  )
}

export default VendorNewReviewEmail

const text = {
  color: EMAIL_THEME.colors.textMuted,
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
}

const alertSection = {
  padding: "24px",
  backgroundColor: EMAIL_THEME.colors.successBackground,
  borderRadius: "8px",
  margin: "24px 0",
  borderLeft: `4px solid ${EMAIL_THEME.colors.success}`,
}

const alertText = {
  color: EMAIL_THEME.colors.success,
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
}

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
}

const button = {
  backgroundColor: EMAIL_THEME.colors.primary,
  borderRadius: "8px",
  color: EMAIL_THEME.colors.background,
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
}

const itemsSection = {
  marginTop: "24px",
  marginBottom: "24px",
}

const itemsTitle = {
  ...text,
  fontWeight: "bold",
  marginBottom: "12px",
}

const itemCard = {
  padding: "16px",
  backgroundColor: "#f9fafb",
  border: `1px solid ${EMAIL_THEME.colors.border}`,
  borderRadius: "8px",
  marginBottom: "12px",
}

const itemName = {
  margin: "0 0 8px 0",
  fontSize: "16px",
  fontWeight: "600",
  color: EMAIL_THEME.colors.foreground,
}

const itemRating = {
  fontWeight: "normal",
  color: EMAIL_THEME.colors.textMuted,
}

const itemReviewTitle = {
  margin: "0 0 4px 0",
  fontSize: "14px",
  fontWeight: "bold",
  color: EMAIL_THEME.colors.foreground,
}

const itemReviewComments = {
  margin: "0",
  fontSize: "14px",
  color: EMAIL_THEME.colors.textMuted,
  fontStyle: "italic",
}
