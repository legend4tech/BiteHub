"use client";

import { useRouter } from "next/navigation";
import { MenuItemForm } from "@/components/vendor/MenuItemForm";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import type { MenuItem } from "@/lib/types";

export default function NewMenuItemPage() {
  const router = useRouter();

  const handleSave = async (data: Omit<MenuItem, "id" | "vendorId" | "vendorName">) => {
    try {
      await apiClient.post("/vendor/menu", data);
      toast.success("Menu item created");
      router.push("/vendor/menu");
      router.refresh();
    } catch (error) {
      toast.error("Failed to save menu item");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Add new item</h1>
      </div>

      <div className="rounded-3xl bg-card border border-border p-6 max-w-2xl">
        <MenuItemForm onSave={handleSave} onCancel={() => router.push("/vendor/menu")} />
      </div>
    </div>
  );
}
