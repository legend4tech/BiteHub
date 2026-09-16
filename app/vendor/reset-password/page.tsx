"use client"

import { useVendorResetPassword } from "@/hooks/vendor/useVendorMutations"
import { SharedResetPassword } from "@/components/shared/SharedResetPassword"

export default function VendorResetPasswordPage() {
  const mutation = useVendorResetPassword()

  return (
    <SharedResetPassword
      userType="vendor"
      loginHref="/vendor/login"
      mutation={mutation}
    />
  )
}
