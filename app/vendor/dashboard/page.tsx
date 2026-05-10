"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardStats } from "@/components/vendor/DashboardStats";
import { OrderTable } from "@/components/vendor/OrderTable";
import type { Order, OrderStatus } from "@/lib/types";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import apiClient from "@/lib/axios";
import { toast } from "sonner";

export default function VendorDashboardPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/vendor/orders");
      setOrders(res.data);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) load();
  }, [session, load]);

  if (status === "loading") {
    return <PageSkeleton variant="dashboard" />;
  }

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const pending = todayOrders.filter((o) => o.status === "pending").length;
  const preparing = todayOrders.filter((o) => o.status === "preparing" || o.status === "confirmed").length;
  const completed = todayOrders.filter((o) => o.status === "completed").length;

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await apiClient.patch(`/vendor/orders/${orderId}`, { status: newStatus });
      load();
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  return (
    <SectionErrorBoundary title="Couldn't load dashboard">
      <div className="space-y-8">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-heading text-2xl font-bold">{session?.user?.name || "Vendor"}</h1>
        </div>

        <DashboardStats
          total={todayOrders.length}
          pending={pending}
          preparing={preparing}
          completed={completed}
        />

        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Recent orders</h2>
            <span className="text-xs text-muted-foreground">{orders.length} total</span>
          </div>

          {loadingOrders ? (
            <PageSkeleton variant="orders-table" count={4} />
          ) : orders.length === 0 ? (
            <EmptyState
              size="sm"
              title="No orders yet"
              description="When customers place orders, they will appear here."
            />
          ) : (
            <OrderTable orders={orders.slice(0, 10)} onStatusChange={handleStatusChange} />
          )}
        </div>
      </div>
    </SectionErrorBoundary>
  );
}
