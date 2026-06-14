"use client"

import { useRouter } from "next/navigation"
import { MenuItemForm } from "@/components/vendor-dashboard/MenuItemForm"
import apiClient from "@/lib/axios"
import { toast } from "sonner"
import type { MenuItemPayload } from "@/lib/types"

export default function NewMenuItemPage() {
  const router = useRouter()

  const handleSave = async (data: MenuItemPayload) => {
    try {
      await apiClient.post("/vendor/menu", data)
      toast.success("Menu item created")
      router.push("/vendor/menu")
      router.refresh()
    } catch {
      toast.error("Couldn't add this menu item. Please try again.")
    }
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
