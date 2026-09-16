"use client"

import { useState, useTransition, useOptimistic } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAdminVendors } from "@/hooks/admin/useAdminVendors"
import { toast } from "sonner"
import {
  useAdminToggleVendorActive,
  useAdminToggleVendorFeatured,
  useAdminToggleVendorManaged,
} from "@/hooks/admin/useAdminMutations"
import { AdminVendors } from "@/components/admin/AdminVendors"
import { AddLoginModal } from "@/components/admin/AdminModals"
import type { AdminVendor } from "@/types/admin"
import { FetchError } from "@/components/shared/FetchError"

export default function AdminVendorsPage() {
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(
    null
  )
  const [togglingManagedId, setTogglingManagedId] = useState<string | null>(
    null
  )
  const [addLoginFor, setAddLoginFor] = useState<AdminVendor | null>(null)
  const queryClient = useQueryClient()

  const {
    data: vendorsData,
    isLoading: loadingVendors,
    isError: isVendorsError,
    refetch: refetchVendors,
  } = useAdminVendors()

  const vendors = vendorsData ?? []

  const [, startTransition] = useTransition()
  const [optimisticVendors, addOptimisticVendor] = useOptimistic(
    vendors,
    (state, updated: AdminVendor) =>
      state.map((v) => (v.id === updated.id ? updated : v))
  )

  const noAccountVendors = optimisticVendors.filter((v) => !v.account)

  const toggleActiveMutation = useAdminToggleVendorActive()
  const toggleFeaturedMutation = useAdminToggleVendorFeatured()
  const toggleManagedMutation = useAdminToggleVendorManaged()

  const toggleVendorActive = (vendor: AdminVendor) => {
    setTogglingId(vendor.id)
    startTransition(() => {
      addOptimisticVendor({ ...vendor, isActive: !vendor.isActive })
    })

    toggleActiveMutation.mutate(
      { vendorId: vendor.id, isActive: !vendor.isActive },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
          toast.success(
            `Vendor ${!vendor.isActive ? "activated" : "deactivated"}`
          )
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          toast.error(err.response?.data?.error || "An error occurred")
        },
        onSettled: () => {
          setTogglingId(null)
        },
      }
    )
  }

  const toggleVendorFeatured = (vendor: AdminVendor) => {
    setTogglingFeaturedId(vendor.id)
    startTransition(() => {
      addOptimisticVendor({ ...vendor, isFeatured: !vendor.isFeatured })
    })

    toggleFeaturedMutation.mutate(
      { vendorId: vendor.id, isFeatured: !vendor.isFeatured },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
          toast.success(
            `${vendor.name} is ${!vendor.isFeatured ? "now featured" : "no longer featured"}`
          )
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          toast.error(err.response?.data?.error || "An error occurred")
        },
        onSettled: () => {
          setTogglingFeaturedId(null)
        },
      }
    )
  }

  const toggleVendorManaged = (vendor: AdminVendor, isManaged: boolean) => {
    setTogglingManagedId(vendor.id)
    startTransition(() => {
      addOptimisticVendor({ ...vendor, isManagedByBiteHub: isManaged })
    })

    toggleManagedMutation.mutate(
      { vendorId: vendor.id, isManagedByBiteHub: isManaged },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
          toast.success(
            `${vendor.name} is ${isManaged ? "now managed by BiteHub" : "no longer managed by BiteHub"}`
          )
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          toast.error(err.response?.data?.error || "An error occurred")
        },
        onSettled: () => {
          setTogglingManagedId(null)
        },
      }
    )
  }

  if (isVendorsError) {
    return (
      <FetchError
        title="Couldn't load vendors"
        onRetry={() => refetchVendors()}
      />
    )
  }

  return (
    <>
      <AdminVendors
        vendors={vendors}
        optimisticVendors={optimisticVendors}
        loadingVendors={loadingVendors}
        noAccountVendors={noAccountVendors}
        togglingId={togglingId}
        togglingFeaturedId={togglingFeaturedId}
        togglingManagedId={togglingManagedId}
        onToggleActive={toggleVendorActive}
        onToggleFeatured={toggleVendorFeatured}
        onToggleManaged={toggleVendorManaged}
        onAddLogin={setAddLoginFor}
      />
      {addLoginFor && (
        <AddLoginModal
          vendor={addLoginFor}
          onClose={() => setAddLoginFor(null)}
          onSuccess={refetchVendors}
        />
      )}
    </>
  )
}
