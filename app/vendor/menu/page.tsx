"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MenuItemRow } from "@/components/vendor/MenuItemRow";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import apiClient from "@/lib/axios";
import { toast } from "sonner";

export default function VendorMenuPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiClient.get("/vendor/menu");
      setItems(res.data);
    } catch (error) {
      console.error("Failed to fetch menu items", error);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) load();
  }, [session]);



  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/vendor/menu/${id}`);
      toast.success("Menu item deleted");
      load();
    } catch (error) {
      toast.error("Failed to delete menu item");
    }
  };

  const handleToggle = async (id: string, available: boolean) => {
    try {
      await apiClient.patch(`/vendor/menu/${id}`, { isAvailable: available });
      toast.success(available ? "Item is now available" : "Item marked as out of stock");
      load();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleEdit = (item: MenuItem) => {
    const itemId = item.id || (item as any)._id;
    router.push(`/vendor/menu/${itemId}/edit`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Menu Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} items</p>
        </div>
        <Button variant="hero" onClick={() => router.push("/vendor/menu/new")}>
          <Plus className="size-4" /> Add item
        </Button>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {loading ? (
          <PageSkeleton variant="menu-management" count={5} />
        ) : items.length === 0 ? (
          <EmptyState
            size="sm"
            icon="🍽️"
            showImage={false}
            title="No menu items yet"
            description="Start building your menu. Add your first dish and make it visible to students on campus."
            action={{ label: "Add first item", onClick: () => router.push("/vendor/menu/new") }}
          />
        ) : (
          items.map((item) => (
            <MenuItemRow key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} onToggleAvailability={handleToggle} />
          ))
        )}
      </div>
    </div>
  );
}
