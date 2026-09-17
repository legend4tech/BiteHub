"use client"

import { useAdminVendors } from "@/hooks/admin/useAdminVendors"
import { useAdminStats } from "@/hooks/admin/useAdminStats"
import { useAdminRetryVendorPayout } from "@/hooks/admin/useAdminMutations"
import { AdminPayouts } from "@/components/admin/AdminPayouts"
import type { AdminVendor } from "@/types/admin"
import { toast } from "sonner"
import { FetchError } from "@/components/shared/FetchError"

export default function AdminPayoutsPage() {
  const {
    data: vendorsData,
    isLoading: loadingVendors,
    isError: isVendorsError,
    refetch: refetchVendors,
  } = useAdminVendors()

  const { data: stats, isLoading: loadingStats } = useAdminStats()

  const vendors = vendorsData ?? []

  const retryPayoutMutation = useAdminRetryVendorPayout()

  const retryVendorPayout = (vendor: AdminVendor) => {
    toast.promise(retryPayoutMutation.mutateAsync(vendor.id), {
      loading: `Retrying payout for ${vendor.name}...`,
      success: "Payout retry initiated successfully!",
      error: (err: unknown) =>
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Failed to retry payout",
    })
  }

  if (isVendorsError) {
    return (
      <FetchError
        title="Couldn't load vendors for payouts"
        onRetry={() => refetchVendors()}
      />
    )
  }

  return (
    <AdminPayouts
      vendors={vendors}
      stats={stats}
      loadingVendors={loadingVendors}
      loadingStats={loadingStats}
      onRetryPayout={retryVendorPayout}
      retryingId={
        retryPayoutMutation.isPending
          ? (retryPayoutMutation.variables as string)
          : null
      }
    />
  )
}
