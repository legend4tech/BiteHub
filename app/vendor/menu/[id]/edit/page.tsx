"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MenuItemForm } from "@/components/vendor/MenuItemForm";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import type { MenuItem } from "@/lib/types";

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await apiClient.get(`/vendor/menu/${id}`);
        setItem(res.data);
      } catch (error) {
        console.error("Failed to fetch menu item", error);
        toast.error("Failed to load menu item");
        router.push("/vendor/menu");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id, router]);

  const handleSave = async (data: Omit<MenuItem, "id" | "vendorId" | "vendorName">) => {
    try {
      await apiClient.patch(`/vendor/menu/${id}`, data);
      toast.success("Menu item updated");
      router.push("/vendor/menu");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update menu item");
    }
  };

  if (loading) {
    return <PageSkeleton variant="menu-item-edit" />;
  }

  if (!item) {
    return <div>Item not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Edit item</h1>
      </div>

      <div className="rounded-3xl bg-card border border-border p-6 max-w-2xl">
        <MenuItemForm initial={item} onSave={handleSave} onCancel={() => router.push("/vendor/menu")} />
      </div>
    </div>
  );
}
