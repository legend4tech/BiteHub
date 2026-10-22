"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, TicketPercent } from "lucide-react"
import { toast } from "sonner"
import { useCreatePromo } from "@/hooks/admin/usePromos"
import { PromoCodeForm } from "@/components/admin/promos/PromoCodeForm"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import { Button } from "@/components/ui/button"
import type { PromoCodeFormInput } from "@/lib/schemas"

export default function NewPromoCodePage() {
  const router = useRouter()
  const { mutateAsync: createPromo, isPending } = useCreatePromo()

  const handleCreate = async (values: PromoCodeFormInput) => {
    try {
      await createPromo(values)
      toast.success(`Promo code "${values.code}" created successfully!`)
      router.push("/admin/promos")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || "Failed to create promo code.")
    }
  }

  return (
    <SectionErrorBoundary title="Couldn't load promo creator">
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
              Create Promo Code
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure discount rules, budget caps, and simulated spending for
            your new coupon campaign.
          </p>
        </div>

        <PromoCodeForm
          onSubmit={handleCreate}
          isSubmitting={isPending}
          submitLabel="Create Promo Code"
        />
      </div>
    </SectionErrorBoundary>
  )
}
