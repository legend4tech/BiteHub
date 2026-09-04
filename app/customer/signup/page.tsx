import { Metadata } from "next"
import CustomerSignupForm from "@/components/customer/CustomerSignupForm"
import { APP_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Sign Up | Customer | ${APP_NAME}`,
  description:
    "Create a customer account to track your orders, hold a wallet, and earn cashback.",
}

export default function CustomerSignupPage() {
  return <CustomerSignupForm />
}
