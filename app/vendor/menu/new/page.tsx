"use client"

import { useRouter } from "next/navigation"
import { MenuItemForm } from "@/components/vendor-dashboard/MenuItemForm"
import { useVendorCreateMenu } from "@/hooks/mutations/useVendorMutations"
import { toast } from "sonner"
import type { MenuItemPayload } from "@/lib/types"

export default function NewMenuItemPage() {
  const router = useRouter()

  const createMenuMutation = useVendorCreateMenu()

  const handleSave = async (data: MenuItemPayload) => {
    await createMenuMutation.mutateAsync(data)
    toast.success("Menu item created")
    router.push("/vendor/menu")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Add new item</h1>
      </div>

      <div className="max-w-2xl rounded-3xl border border-border bg-card p-6">
        <MenuItemForm
          onSave={handleSave}
          onCancel={() => router.push("/vendor/menu")}
        />
      </div>
    </div>
  )
}
