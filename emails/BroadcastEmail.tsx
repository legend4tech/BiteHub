import * as React from "react"
import { EmailLayout } from "./EmailLayout"
import { EMAIL_THEME } from "@/lib/email-theme"

interface BroadcastEmailProps {
  subject: string
  htmlContent: string
}

export const BroadcastEmail = ({
  subject,
  htmlContent,
}: BroadcastEmailProps) => {
  // A simple footer note with an unsubscribe link placeholder (to be replaced by the backend)
  const footerNote = (
    <span>
      You are receiving this email because you subscribed to BiteHub updates.{" "}
      <a
        href="{{UNSUBSCRIBE_LINK}}"
        style={{
          color: EMAIL_THEME.colors.primary,
          textDecoration: "underline",
        }}
      >
        Unsubscribe here
      </a>
      .
    </span>
  )

  return (
    <EmailLayout
      preview={subject}
      subheader="BiteHub Update"
      footerNote={footerNote}
    >
      <div
        style={contentStyle}
        dangerouslySetInnerHTML={{
          __html: htmlContent.replace(
            /<img /g,
            '<img style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block;" '
          ),
        }}
      />
    </EmailLayout>
  )
}

export default BroadcastEmail

const contentStyle = {
  fontSize: "15px",
  lineHeight: "24px",
  color: EMAIL_THEME.colors.foreground,
  margin: "0 0 16px 0",
}
