import { SUPPORT_EMAIL } from "@/lib/constants"

interface SuspendedAlertProps {
  type: "customer" | "vendor" | "admin" | "vendor-manager"
}

export function SuspendedAlert({ type }: SuspendedAlertProps) {
  let message = ""

  switch (type) {
    case "customer":
      message = `Account suspended. Please contact ${SUPPORT_EMAIL} to resolve this or claim any remaining wallet balance.`
      break
    case "vendor":
      message = `Your vendor account has been suspended. Please contact ${SUPPORT_EMAIL} to resolve this.`
      break
    case "admin":
      message = `Your admin access has been revoked. Please contact a superadmin at ${SUPPORT_EMAIL}.`
      break
    case "vendor-manager":
      message = `Your vendor manager access has been revoked. Please contact a superadmin at ${SUPPORT_EMAIL}.`
      break
  }

  return (
    <div className="rounded-md bg-destructive/15 p-4 text-sm font-medium text-destructive">
      {message}
    </div>
  )
}
