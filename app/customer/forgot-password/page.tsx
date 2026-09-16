"use client"

import { useCustomerForgotPassword } from "@/hooks/customer/useCustomerMutations"
import { SharedForgotPassword } from "@/components/shared/SharedForgotPassword"

export default function CustomerForgotPasswordPage() {
  const mutation = useCustomerForgotPassword()

  return (
    <SharedForgotPassword
      title="Forgot Password"
      description="Enter your email address and we'll send you a link to reset your password."
      userType="customer"
      loginHref="/customer/login"
      mutation={mutation}
    />
  )
}
