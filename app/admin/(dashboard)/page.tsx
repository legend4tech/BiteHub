"use client"

import { useRouter } from "next/navigation"
import { useAdminStats } from "@/hooks/admin/useAdminStats"
import { useAdminVendors } from "@/hooks/admin/useAdminVendors"
import { AdminOverview } from "@/components/admin/AdminOverview"
import { FetchError } from "@/components/shared/FetchError"

export default function AdminPage() {
  const router = useRouter()
  const {
    data: stats,
    isLoading: loadingStats,
    isError: isStatsError,
    refetch: refetchStats,
  } = useAdminStats()

  const { data: vendorsData } = useAdminVendors()
  const noAccountVendors = vendorsData
    ? vendorsData.filter((v) => !v.account)
    : []

  if (isStatsError) {
    return (
      <FetchError
        title="Couldn't load overview stats"
        onRetry={() => refetchStats()}
      />
    )
  }

  return (
    <AdminOverview
      stats={stats}
      loadingStats={loadingStats}
      noAccountVendors={noAccountVendors}
      onGoToVendors={() => router.push("/admin/vendors")}
      onRefresh={() => refetchStats()}
    />
  )
}
