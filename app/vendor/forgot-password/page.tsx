"use client"

import { useVendorForgotPassword } from "@/hooks/vendor/useVendorMutations"
import { SharedForgotPassword } from "@/components/shared/SharedForgotPassword"

export default function VendorForgotPasswordPage() {
  const mutation = useVendorForgotPassword()

  return (
    <SharedForgotPassword
      title="Forgot Password"
      description="Enter your email address and we'll send you a link to reset your password."
      userType="vendor"
      loginHref="/vendor/login"
      mutation={mutation}
    />
  )
}
