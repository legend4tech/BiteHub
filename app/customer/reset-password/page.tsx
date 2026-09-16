"use client"

import { useCustomerResetPassword } from "@/hooks/customer/useCustomerMutations"
import { SharedResetPassword } from "@/components/shared/SharedResetPassword"

export default function CustomerResetPasswordPage() {
  const mutation = useCustomerResetPassword()

  return (
    <SharedResetPassword
      userType="customer"
      loginHref="/customer/login"
      mutation={mutation}
    />
  )
}
