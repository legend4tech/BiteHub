"use client"

import { useRouter, useParams } from "next/navigation"
import { useCampaigns, useUpdateCampaign } from "@/hooks/admin/useCampaigns"
import { CampaignForm } from "@/components/admin/campaigns/CampaignForm"
import { toast } from "sonner"

import { EmptyState } from "@/components/shared/EmptyState"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { RewardCampaignFormValues } from "@/lib/schemas/admin"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function EditCampaignPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: campaigns, isLoading, isError, refetch } = useCampaigns()
  const { mutateAsync: updateCampaign, isPending } = useUpdateCampaign()

  const campaign = campaigns?.find(
    (c: RewardCampaignFormValues & { id: string }) => c.id === id
  )

  const handleSubmit = async (data: RewardCampaignFormValues) => {
    try {
      await updateCampaign({ id, data })
      toast.success("Campaign updated successfully")
      router.push("/admin/campaigns")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || "Failed to update campaign")
    }
  }

  if (isLoading) {
    return <PageSkeleton variant="menu-item-edit" />
  }

  if (isError) {
    return (
      <FetchError
        message="Failed to load campaign data."
        onRetry={() => refetch()}
      />
    )
  }

  if (!campaign) {
    return (
      <EmptyState
        title="Campaign Not Found"
        description="The campaign you are trying to edit does not exist or has been removed."
        action={{
          label: "Back to Campaigns",
          onClick: () => router.push("/admin/campaigns"),
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div>
        <Button
          variant="ghost"
          asChild
          className="mb-4 -ml-4 text-muted-foreground"
        >
          <Link href="/admin/campaigns">
            <ArrowLeft className="mr-2 size-4" />
            Back to Campaigns
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Campaign</h1>
        <p className="mt-1 text-muted-foreground">
          Modify the triggers, rewards, and constraints for {campaign.title}.
        </p>
      </div>

      <CampaignForm
        defaultValues={{
          title: campaign.title,
          description: campaign.description || "",
          actionType: campaign.actionType,
          targetCount: campaign.targetCount,
          minOrderValueInKobo: campaign.minOrderValue || 0,
          rewardType: campaign.rewardType,
          rewardValueInKobo: campaign.rewardValue || 0,
          vendorId: campaign.vendorId || "",
          menuItemId: campaign.menuItemId || "",
          maxBeneficiaries: campaign.maxBeneficiaries ?? 10,
          budgetAllocatedInKobo: campaign.budgetAllocated ?? 0,
          isActive: campaign.isActive,
          maxCompletionsPerUser: campaign.maxCompletionsPerUser ?? 1,
          startDate: campaign.startDate
            ? new Date(campaign.startDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        }}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        submitLabel="Save Changes"
      />
    </div>
  )
}
