"use client"

import { useState } from "react"
import { TermsAcceptanceModal } from "./TermsAcceptanceModal"
import { useCustomerAcceptTerms } from "@/hooks/customer/useCustomerMutations"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CustomerTermsChecker({
  initialAcceptedVersion,
  currentVersion,
}: {
  initialAcceptedVersion?: string | null
  currentVersion: string
}) {
  const [hasAcceptedLocally, setHasAcceptedLocally] = useState(false)
  const [acceptingTerms, setAcceptingTerms] = useState(false)

  const acceptTermsMutation = useCustomerAcceptTerms()
  const router = useRouter()

  const needsTermsAcceptance =
    initialAcceptedVersion !== currentVersion && !hasAcceptedLocally

  const handleAcceptTerms = async (): Promise<void> => {
    setAcceptingTerms(true)
    acceptTermsMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Thank you! You have accepted the updated terms.")
        setHasAcceptedLocally(true)
        router.refresh() // Refreshes the server component data to reflect the new state
      },
      onError: () => {
        toast.error("Couldn't record terms acceptance. Please try again.")
      },
      onSettled: () => {
        setAcceptingTerms(false)
      },
    })
  }

  // If we don't need acceptance, render nothing
  if (!needsTermsAcceptance) return null

  return (
    <TermsAcceptanceModal
      open={needsTermsAcceptance}
      isNewcomer={!initialAcceptedVersion}
      acceptingTerms={acceptingTerms}
      onAccept={handleAcceptTerms}
    />
  )
}
