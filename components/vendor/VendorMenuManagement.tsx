"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MenuItemRow } from "@/components/vendor/MenuItemRow";
import type { MenuItem } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

interface VendorMenuManagementProps {
  initialItems: MenuItem[];
}

export function VendorMenuManagement({ initialItems }: VendorMenuManagementProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["vendor-menu"],
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`/vendor/menu?page=${pageParam}&limit=10`);
      return response.data as MenuItem[];
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.length < 10) return undefined;
      return lastPageParam + 1;
    },
    initialPageParam: 1,
    initialData: { pages: [initialItems], pageParams: [1] },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data ? data.pages.flat() : [];

  const handleEdit = (item: MenuItem) => {
    router.push(`/vendor/menu/${item.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/vendor/menu/${id}`);
      toast.success("Menu item deleted");
      queryClient.invalidateQueries({ queryKey: ["vendor-menu"] });
    } catch (error) {
      toast.error("Failed to delete menu item");
    }
  };

  const handleToggle = async (id: string, available: boolean) => {
    try {
      await apiClient.patch(`/vendor/menu/${id}`, { isAvailable: available });
      toast.success(available ? "Item is now available" : "Item marked as out of stock");
      queryClient.invalidateQueries({ queryKey: ["vendor-menu"] });
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-3">
      {isFetching && !items.length ? (
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
        <>
          {items.map((item) => (
            <MenuItemRow key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} onToggleAvailability={handleToggle} />
          ))}
          
          {/* Infinite load trigger */}
          {(hasNextPage || isFetchingNextPage) && (
            <div ref={ref} className="py-4">
              <PageSkeleton variant="menu-management" count={2} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
