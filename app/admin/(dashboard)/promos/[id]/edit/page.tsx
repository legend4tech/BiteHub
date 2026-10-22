"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, TicketPercent } from "lucide-react"
import { toast } from "sonner"
import { usePromo, useUpdatePromo } from "@/hooks/admin/usePromos"
import { PromoCodeForm } from "@/components/admin/promos/PromoCodeForm"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { EmptyState } from "@/components/shared/EmptyState"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import { Button } from "@/components/ui/button"
import type { PromoCodeFormInput } from "@/lib/schemas"

interface EditPromoCodePageProps {
  params: Promise<{ id: string }>
}

export default function EditPromoCodePage({ params }: EditPromoCodePageProps) {
  const { id } = use(params)
  const router = useRouter()

  const { data: promo, isLoading, isError, refetch } = usePromo(id)
  const { mutateAsync: updatePromo, isPending: isUpdating } = useUpdatePromo()

  const handleUpdate = async (values: PromoCodeFormInput) => {
    try {
      await updatePromo({ id, data: values })
      toast.success(
        `Promo code "${promo?.code || values.code}" updated successfully!`
      )
      router.push("/admin/promos")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || "Failed to update promo code.")
    }
  }

  if (isLoading) {
    return <PageSkeleton variant="admin-promo-form" />
  }

  if (isError) {
    return (
      <div className="w-full">
        <FetchError
          title="Failed to Load Promo Code"
          message="Could not retrieve the promo code details from the server."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (!promo) {
    return (
      <div className="w-full">
        <EmptyState
          icon={<TicketPercent className="h-10 w-10 text-primary" />}
          title="Promo Code Not Found"
          description="The promo code you are trying to edit does not exist or may have been deleted."
          action={{
            label: "Back to Promo Codes",
            onClick: () => router.push("/admin/promos"),
          }}
        />
      </div>
    )
  }

  return (
    <SectionErrorBoundary title="Couldn't load promo editor">
      <div className="w-full space-y-6 pb-12">
        <div>
          <Button
            variant="ghost"
            asChild
            className="mb-3 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <Link href="/admin/promos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Promo Codes
            </Link>
          </Button>

          <div className="flex items-center gap-2.5">
            <TicketPercent className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Edit Promo Code:{" "}
              <span className="font-mono font-bold text-primary">
                {promo.code}
              </span>
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Update budget limits, discount rules, active status, and simulator
            projections.
          </p>
        </div>

        <PromoCodeForm
          initialData={promo}
          onSubmit={handleUpdate}
          isSubmitting={isUpdating}
          submitLabel="Save Changes"
        />
      </div>
    </SectionErrorBoundary>
  )
}
