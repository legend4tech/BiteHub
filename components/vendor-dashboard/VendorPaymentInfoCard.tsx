import {
  CalendarClock,
  CheckCircle,
  Lock,
  Loader2,
  Building2,
  User,
  Hash,
} from "lucide-react"
import { useMonnifyAccountValidation } from "@/hooks/useMonnifyAccountValidation"

interface VendorPaymentInfoCardProps {
  integrationStatus?: string
  subAccountCode?: string
  isLocked: boolean
  daysLeft: number
  configuredBankCode?: string
  configuredAccountNumber?: string
  banks?: { code: string; name: string }[]
}

export function VendorPaymentInfoCard({
  integrationStatus,
  subAccountCode,
  isLocked,
  daysLeft,
  configuredBankCode,
  configuredAccountNumber,
  banks,
}: VendorPaymentInfoCardProps) {
  const configuredBankName = banks?.find(
    (b) => b.code === configuredBankCode
  )?.name

  const { accountName, isFetchingName } = useMonnifyAccountValidation(
    configuredAccountNumber || "",
    configuredBankCode || ""
  )

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="font-heading text-lg font-bold">Monnify Integration</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {integrationStatus === "active"
          ? "Your account is successfully connected to Monnify! Customers can pay you securely."
          : "Connect your bank account to start receiving automated payments."}
      </p>

      <div className="mt-4 rounded-xl border border-border/50 bg-background/50 p-4 text-sm text-muted-foreground shadow-sm">
        <p className="flex items-center font-semibold text-foreground">
          <CalendarClock className="mr-2 size-4 text-primary" />
          Payout Schedule
        </p>
        <ul className="mt-2 list-outside list-disc space-y-1 pl-4">
          <li>
            Funds are settled into your bank account{" "}
            <strong>every single day</strong>.
          </li>
          <li>This includes weekends and public holidays.</li>
          <li>
            Settlements usually run around <strong>10:00 PM daily</strong>.
          </li>
        </ul>
      </div>

      {integrationStatus === "active" && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <CheckCircle className="size-3.5" /> Active Subaccount:{" "}
            {subAccountCode}
          </span>
        </div>
      )}

      {configuredAccountNumber && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Currently Configured Bank Account
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="size-4 shrink-0 text-primary" />
              <span>{configuredBankName || configuredBankCode}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="size-4 shrink-0 text-primary" />
              <span>{configuredAccountNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
              <User className="size-4 shrink-0 text-primary" />
              {isFetchingName ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-3 animate-spin" /> Verifying name...
                </span>
              ) : (
                <span className="font-medium text-foreground">
                  {accountName || "Account Name Unavailable"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            For your security, your payout details are protected and cannot be
            changed for{" "}
            <strong>
              {daysLeft} more day{daysLeft !== 1 ? "s" : ""}
            </strong>
            . You can safely update them once this period ends.
          </p>
        </div>
      )}
    </div>
  )
}
