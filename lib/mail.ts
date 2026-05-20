import { Resend } from "resend";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  vendorName: string,
  resetLink: string,
  expiryMinutes: number = 15
) {
  const fromEmail = process.env.EMAIL_FROM || "BiteHub <no-reply@bitehubapp.com>";
  
  // Resend requires verified domains in production. In development without a verified domain,
  // we fallback to their testing sandbox onboarding address if EMAIL_FROM isn't configured.
  const resolvedFrom = process.env.NODE_ENV === "production" 
    ? fromEmail 
    : (process.env.EMAIL_FROM || "onboarding@resend.dev");

  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not defined in env. Logged reset link:", resetLink);
    return { success: false, error: "Email provider key missing" };
  }

  try {
    const data = await resend.emails.send({
      from: resolvedFrom,
      to: email,
      subject: "Reset your BiteHub vendor password",
      react: React.createElement(ResetPasswordEmail, {
        vendorName,
        resetLink,
        expiryMinutes,
      }),
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
}
