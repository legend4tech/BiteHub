"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VendorManagerCreationForm } from "@/components/vendor-manager/VendorManagerCreationForm"

export default function VendorManagerNewVendorPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl px-6">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0 rounded-xl"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">Add New Vendor</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create a vendor profile and login account
          </p>
        </div>
      </div>

      {/* Form */}
      <VendorManagerCreationForm />
    </div>
  )
}
