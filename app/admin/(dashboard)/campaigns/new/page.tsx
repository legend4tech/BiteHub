"use client"

import { useRouter } from "next/navigation"
import { useCreateCampaign } from "@/hooks/admin/useCampaigns"
import { CampaignForm } from "@/components/admin/campaigns/CampaignForm"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

import { RewardCampaignFormValues } from "@/lib/schemas/admin"

export default function NewCampaignPage() {
  const router = useRouter()
  const { mutateAsync: createCampaign, isPending } = useCreateCampaign()

  const handleSubmit = async (data: RewardCampaignFormValues) => {
    try {
      await createCampaign(data)
      toast.success("Campaign created successfully")
      router.push("/admin/campaigns")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || "Failed to create campaign")
    }
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
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Campaign
        </h1>
        <p className="mt-1 text-muted-foreground">
          Define triggers, rewards, and constraints for your new gamification
          campaign.
        </p>
      </div>

      <CampaignForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        submitLabel="Create Campaign"
      />
    </div>
  )
}
