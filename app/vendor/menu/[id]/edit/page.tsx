"use client"

import { useRouter, useParams } from "next/navigation"
import { MenuItemForm } from "@/components/vendor/MenuItemForm"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import apiClient from "@/lib/axios"
import { toast } from "sonner"
import type { MenuItem } from "@/lib/types"
import { useMenuItemDetail } from "@/hooks/queries/useMenuItemDetail"

export default function EditMenuItemPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // Fetch menu item using React Query
  const { data: item, isLoading } = useMenuItemDetail(id)

  const handleSave = async (
    data: Omit<MenuItem, "id" | "vendorId" | "vendorName">
  ) => {
    try {
      await apiClient.patch(`/vendor/menu/${id}`, data)
      toast.success("Menu item updated")
      router.push("/vendor/menu")
      router.refresh()
    } catch {
      toast.error("Failed to update menu item")
    }
  }

  if (isLoading) {
    return <PageSkeleton variant="menu-item-edit" />
  }

  if (!item) {
    return <div>Item not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/vendor/menu")}
        >
          <ArrowLeft className="mr-2 size-4" /> Back
        </Button>
        <h1 className="font-heading text-2xl font-bold">Edit item</h1>
      </div>

      <div className="max-w-2xl rounded-3xl border border-border bg-card p-6">
        <MenuItemForm
          initial={item}
          onSave={handleSave}
          onCancel={() => router.push("/vendor/menu")}
        />
      </div>
    </div>
  )
}
